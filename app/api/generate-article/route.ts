// ============================================================
// /api/generate-article — Server-side OpenAI article generation
//
// REQUIRED ENVIRONMENT VARIABLES (set in Vercel or .env.local):
//   OPENAI_API_KEY              — Your OpenAI API key (server-side only)
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================
export const dynamic = 'force-dynamic'
export const maxDuration = 180

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { validateArticle, generateValidationReport, countWords } from '@/lib/article-validation'
import type { GenerateArticleRequest, GeneratedArticleDraft, InternalLinkTarget } from '@/types'

type StructureMode =
  | 'article_only'
  | 'article_with_short_checklist'
  | 'article_with_short_faq'
  | 'article_with_checklist_and_faq'

// Keep the public article body narrative by default.
// Checklist/FAQ fields can still be returned as CMS metadata, but forcing them
// into the body makes the draft read like a templated AI blog post.
const structureModes: StructureMode[] = [
  'article_only',
]

type TopicCandidate = {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

const normaliseName = (input?: string | null) =>
  input
    ?.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim() || ''

const findBestTopic = (
  topics: TopicCandidate[],
  names: Array<string | null | undefined>
): TopicCandidate | null => {
  const childTopics = topics.filter((topic) => topic.parent_id)
  const allTopics = [...childTopics, ...topics.filter((topic) => !topic.parent_id)]

  for (const name of names) {
    const normalised = normaliseName(name)
    if (!normalised) continue

    const direct = allTopics.find((topic) =>
      normaliseName(topic.name) === normalised || normaliseName(topic.slug) === normalised
    )
    if (direct) return direct

    const partial = childTopics.find((topic) => {
      const topicName = normaliseName(topic.name)
      return topicName && (normalised.includes(topicName) || topicName.includes(normalised))
    })
    if (partial) return partial
  }

  return null
}

const buildTopicTaxonomy = (topics: TopicCandidate[]) => {
  const parents = topics.filter((topic) => !topic.parent_id)
  return parents
    .map((parent) => {
      const children = topics
        .filter((topic) => topic.parent_id === parent.id)
        .map((child) => '  - ' + child.name + ' [slug: ' + child.slug + ', id: ' + child.id + ']')
        .join('\n')

      return children
        ? '- ' + parent.name + ' [slug: ' + parent.slug + ', id: ' + parent.id + ']\n' + children
        : '- ' + parent.name + ' [slug: ' + parent.slug + ', id: ' + parent.id + ']'
    })
    .join('\n')
}

const contentClusterMap: Record<string, { pillar: string; cluster: string }> = {
  'Physical Security': { pillar: 'Physical Security', cluster: 'physical-security-practice' },
  'Access Control': { pillar: 'Physical Security', cluster: 'access-control-failures' },
  'CCTV & Surveillance': { pillar: 'Physical Security', cluster: 'cctv-real-world-use' },
  'Surveillance Systems': { pillar: 'Physical Security', cluster: 'cctv-real-world-use' },
  'Perimeter Security': { pillar: 'Physical Security', cluster: 'perimeter-security' },
  'Workplace Awareness': { pillar: 'Workplace Awareness', cluster: 'human-behaviour-risk' },
  'Human Behaviour': { pillar: 'Workplace Awareness', cluster: 'predictability-and-routine' },
  'Security Culture': { pillar: 'Workplace Awareness', cluster: 'security-culture-drift' },
  'Digital Threats': { pillar: 'Digital Threats', cluster: 'digital-risk-basics' },
  'Network Security': { pillar: 'Digital Threats', cluster: 'remote-work-network-risk' },
  'Data Protection': { pillar: 'Digital Threats', cluster: 'data-exposure' },
  'Authentication & Passwords': { pillar: 'Digital Threats', cluster: 'authentication-failures' },
  'Public Wi-Fi Risks': { pillar: 'Remote Work Security', cluster: 'public-wifi-risk' },
  'Home Network Security': { pillar: 'Remote Work Security', cluster: 'home-network-risk' },
  'Device Security': { pillar: 'Remote Work Security', cluster: 'device-security' },
  'Social Engineering': { pillar: 'Social Engineering', cluster: 'social-engineering-patterns' },
  'Phishing & Deception': { pillar: 'Social Engineering', cluster: 'phishing-human-factors' },
  'Physical Social Engineering': { pillar: 'Social Engineering', cluster: 'physical-social-engineering' },
  'Incident Response': { pillar: 'Incident Response', cluster: 'incident-response-reality' },
  'Risk Management': { pillar: 'Risk Management', cluster: 'risk-perception' },
}

const toneModes = [
  'operational and realistic',
  'direct but measured',
  'client-facing advisory',
  'reflective practitioner',
  'field-note practical',
]

const stableHash = (input: string) =>
  Array.from(input).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)


const normaliseClusterText = (input?: string | null) =>
  input
    ?.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'general-security'

const resolveCluster = (category?: string | null, subcategory?: string | null, prompt?: string | null) => {
  const mapped = (subcategory && contentClusterMap[subcategory]) || (category && contentClusterMap[category])
  if (mapped) return mapped

  const fallback = category || subcategory || prompt || 'General Security'
  return {
    pillar: category || 'Security Awareness',
    cluster: normaliseClusterText(fallback),
  }
}

const parseInternalLinks = (value: unknown): InternalLinkTarget[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((link): link is InternalLinkTarget =>
      Boolean(link && typeof link === 'object' && 'slug' in link && 'title' in link && 'anchor' in link)
    )
    .map((link) => ({
      title: String(link.title).slice(0, 120),
      slug: String(link.slug).replace(/^\/+|\/+$/g, ''),
      anchor: String(link.anchor).slice(0, 80),
      reason: link.reason ? String(link.reason).slice(0, 180) : undefined,
    }))
    .filter((link) => link.slug && link.title && link.anchor)
    .slice(0, 4)
}


const cleanInternalLinkTitle = (title: string) =>
  String(title || '')
    .replace(/^to\s+/i, '')
    .replace(/^how\s+to\s+to\s+/i, 'How to ')
    .replace(/\s+/g, ' ')
    .trim()

const buildInternalLinkAnchor = (title: string) => {
  const cleaned = cleanInternalLinkTitle(title)
  return cleaned
    .replace(/^(Why|How|What|When|Where)\s+/i, '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim()
    .slice(0, 80) || cleaned.slice(0, 80)
}

const softenPublicArticleLanguage = (content: string) => {
  if (!content) return content

  return content
    .replace(/\baccess control points\b/gi, 'entry points')
    .replace(/\baccess control point\b/gi, 'entry point')
    .replace(/\bunauthori[sz]ed access\b/gi, 'someone getting in')
    .replace(/\bcumulative failures\b/gi, 'small failures stacking up')
    .replace(/\blayered approach\b/gi, 'rest of the security setup')
    .replace(/\brisk controls\b/gi, 'security measures')
    .replace(/\bperimeter defen[cs]es\b/gi, 'fences, gates and doors')
    .replace(/\bdeterrence value\b/gi, 'practical value')
    .replace(/\bsecurity posture\b/gi, 'security setup')
    .replace(/\bformal assessment\b/gi, 'site check')
    .replace(/\bmitigation strategy\b/gi, 'fix')
    .replace(/\bnullify front-door security measures\b/gi, 'make the front-door lock less meaningful')
    .replace(/\bpractical perimeter security means\b/gi, 'A practical perimeter check starts with')
    .replace(/\bthe initial unauthori[sz]ed entry\b/gi, 'the first way in')
}

const pickFallbackLinkTargets = (
  candidates: Array<{ title: string; slug: string; excerpt?: string | null; content_cluster?: string | null; pillar_topic?: string | null }>,
  draft: Partial<GeneratedArticleDraft>,
  prompt: string
): InternalLinkTarget[] => {
  const haystack = normaliseName([
    prompt,
    draft.title,
    draft.category,
    draft.subcategory,
    draft.content_cluster,
    draft.pillar_topic,
    ...(draft.keyword_suggestions ?? []),
  ].filter(Boolean).join(' '))

  const haystackWords = haystack.split(' ').filter((word) => word.length > 3)

  const scored = candidates.map((candidate) => {
    const candidateText = normaliseName([
      candidate.title,
      candidate.excerpt,
      candidate.content_cluster,
      candidate.pillar_topic,
    ].filter(Boolean).join(' '))
    const candidateWords = new Set(candidateText.split(' ').filter((word) => word.length > 3))
    const score = haystackWords.filter((word) => candidateWords.has(word)).length
    return { candidate, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0 || scored.length <= 2)
    .slice(0, 2)
    .map(({ candidate }) => ({
      title: cleanInternalLinkTitle(candidate.title),
      slug: candidate.slug.replace(/^\/+|\/+$/g, ''),
      anchor: buildInternalLinkAnchor(candidate.title),
      reason: 'Automatically selected as a related internal article candidate.',
    }))
}

const enforceInternalLinkInjection = (
  draft: GeneratedArticleDraft & { article?: string; internal_links?: InternalLinkTarget[]; internal_link_targets?: InternalLinkTarget[] },
  candidates: Array<{ title: string; slug: string; excerpt?: string | null; content_cluster?: string | null; pillar_topic?: string | null }>,
  prompt: string
) => {
  if (!draft.content || candidates.length === 0) return draft

  const existingLinks = parseInternalLinks(draft.internal_links || draft.internal_link_targets)
  const targets = existingLinks.length > 0
    ? existingLinks.slice(0, 2)
    : pickFallbackLinkTargets(candidates, draft, prompt).slice(0, 2)

  // Keep contextual internal links as metadata only.
  // Forced body injection created unnatural SEO sentences and made drafts read AI-generated.
  // The public article pages can still show these as related reading, and the editor can add
  // a contextual link manually when it genuinely fits the paragraph.
  draft.internal_links = targets
  draft.internal_link_targets = targets
  return draft
}

const jsonError = (message: string, status = 500, details?: unknown) =>
  NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
    },
    { status }
  )

const getErrorMessage = (err: unknown, fallback = 'Article generation failed') => {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err.trim()) return err
  return fallback
}

const buildSystemPrompt = (structureMode: StructureMode) => `You are writing for StaySecure360 in the voice of an experienced security operator and risk professional. The voice is practical, factual, field-informed, and direct. It is not theatrical, cynical, salesy, or polished like a corporate blog.

CORE WRITING PHILOSOPHY:
Write like someone explaining what they regularly see during inspections, incident reviews, control room work, site walks, audits, or client conversations. The point is not to sound "gritty". The point is to sound observant, specific, and operationally credible.

PUBLIC ARTICLE REGISTER:
- The public article must not sound like a formal audit report, assessment document, incident report, or compliance memo.
- Write for an intelligent homeowner, business owner, facilities manager, or team leader who wants the practical truth without jargon.
- Translate formal security language into plain practitioner language. For example, prefer "side gate", "rear door", "someone getting in", "weak spot", "small failures", "routine", "habit", "maintenance check", and "what the camera actually sees" over report-style terms.
- Avoid overusing terms such as "access control point", "unauthorized access", "unauthorised access", "cumulative failures", "layered approach", "vulnerability", "protocols", "risk controls", "perimeter defenses", "deterrence value", and "security posture" unless the user specifically asks for a formal report.
- The reader should feel like a practitioner is walking them through what they would notice on site, not reading findings from an assessment template.

VOICE AND TONE:
- Calm, direct, and experienced.
- Practical rather than dramatic.
- Specific about how controls fail in real life.
- Use "I" only when it genuinely helps the article feel like a field observation.
- Avoid invented hero stories or exaggerated war-story language.
- Avoid grumpy ranting, punchline writing, motivational language, or internet-thread aggression.
- Do not write like a character. Write like a practitioner.
- Do not write like a security consultant filling out an inspection report.

HUMAN WRITING RULES:
1. Keep one clear through-line. Do not try to cover the whole topic.
2. Use 3-4 developed examples at most. Explain them properly instead of listing every possible issue.
3. Let the article move like a site walk, inspection, incident review, or operational explanation rather than a category-by-category report.
4. Do not give every issue equal weight. Some observations can be short; others can carry the article.
5. Vary sentence and paragraph length naturally, but do not force fragments every few lines.
6. Prefer precise observations over attitude. A weak strike plate, an unlatched rear gate, a dead backup battery, or a camera pointing at the wrong area is stronger than a clever line.
7. Do not use neat transitions such as "Furthermore," "Moreover," "Additionally," "First," "Second," or "Finally." Just move to the next observation.
8. Do not recap what you just said. Once the point is made, move on.
9. Do not end with a polished conclusion. Stop on a practical observation, unresolved risk, or grounded warning.
10. Do not repeatedly announce observations with phrases such as "A common issue", "A common failure", "I often find", "I often encounter", "I often observe", "Frequently", or "In many cases". Vary the movement naturally.
11. Keep the language plain enough that it could be said to a client during a site walk. Operational detail is good; audit-report wording is not.

HARD NARROWING RULE:
- A good StaySecure360 article is not comprehensive. It follows one inspection route or one failure pattern.
- For residential perimeter articles, usually stay on this route unless the user asks otherwise: side/rear gate → rear sliding door or rear access point → camera/alarm confidence gap → maintenance or household habit.
- Do not add standalone paragraphs for every nearby topic. Windows, lighting, landscaping, rentals, locks, CCTV, alarms, codes, fences, and behaviour must not all receive their own paragraph in the same article.
- If more than four major issue areas appear, cut the weakest ones before returning the article.
- Extra points may be mentioned briefly only when they directly support the route already being walked.
- Narrowing must not turn the article into a formal access-control report. Keep the route, but explain it in plain field language.

ANTI-TEMPLATE RULE:
- No Markdown headings in the visible article body.
- No numbered sections in the visible article body.
- No bullet lists in the visible article body.
- No FAQ or checklist inside the visible article body unless explicitly requested by the user.
- Do not write one paragraph per category.
- Do not write a full syllabus of the topic. Narrow hard before returning the article.
- Avoid repeated paragraph openings such as "Windows are...", "Windows behind...", "CCTV coverage...", "Alarm systems...", "Lighting plays...", "Lastly...", "Landscaping...", "For businesses...", "For rental properties...", "Practical perimeter security means...", or "Another issue is...".
- Also avoid repeated inspection-report openings such as "A common issue...", "A common failure...", "I often find...", "I often encounter...", "I often observe...", "Frequently...", "In many cases...", or "In some cases...".
- The JSON may still include checklist_items and faq_items for CMS metadata, but the visible article should read as a narrative article.

BANNED AI / OVER-POLISHED PHRASES:
Do not use: "In today's world", "In conclusion", "It is important to note", "A comprehensive approach", "Delve into", "Peace of mind", "Robust security", "The reality is", "When it comes to", "Crucial to consider", "Stay vigilant", "Culture of awareness", "The key takeaway", "Ultimately", "This article explores", "Furthermore", "Moreover", "Additionally", "First", "Second", "Finally".

BANNED FAKE-GRIT / THEATRICAL PHRASES:
Do not use: "brutal truth", "battlefield", "frontier", "Hollywood break-ins", "bad guys", "lazy thieves", "movie villains", "security theatre" unless technically appropriate, "not sexy", "gritty", "wake-up call", "game changer", "hard truth", "no-nonsense", "lasers", "fortress", "no gadget replaces grit", "enough with the excuses", "come on in".

BANNED FORMAL REPORT / AUDIT PHRASES FOR PUBLIC ARTICLES:
Do not use: "access control point", "unauthorized access", "unauthorised access", "cumulative failures", "layered approach", "risk controls", "perimeter defenses", "perimeter defences", "deterrence value", "security posture", "formal assessment", "mitigation strategy", "nullify front-door security measures", "practical perimeter security means", "the initial unauthorized entry", "the initial unauthorised entry".

TECHNICAL ACCURACY RULES:
- Avoid questionable claims about specialist attack tools unless the prompt specifically asks for them.
- Do not mention RFID jammers, hacking gadgets, or sophisticated bypass methods in ordinary residential articles unless technically relevant and accurately explained.
- Do not exaggerate how easy a bypass is unless the weakness described genuinely supports it.
- If discussing a credit-card bypass, make clear it applies to loose spring latches or poor handle locks, not a properly thrown deadbolt.
- If discussing deadbolts, distinguish between the lock body, the strike plate, the frame, screw length, and door alignment.
- If discussing alarms and CCTV, focus on ordinary failure modes: dead backup batteries, disabled notifications, full storage, missed alerts, poor camera angles, dirty lenses, app access problems, nobody checking the system, shared codes, misaligned sensors, unlocked gates, poor lighting, and weak maintenance.

INTERNAL LINK RULES:
- Do not force internal links into the article body.
- If a link fits naturally, use it sparingly and only where it belongs.
- Prefer returning internal link targets in the internal_links metadata field so the site can display related reading separately.
- Never interrupt a field observation with an SEO-style link sentence.
- Never use phrases like "it's worth looking at", "for a broader look", "I often reference", "check out", or "the failure mode here is similar" just to place a link.

LENGTH AND DEPTH:
- Aim for 800-1000 words unless the user asks for a longer article.
- Depth should come from practical nuance, not from adding more categories.
- If the article is getting long, narrow it. Do not add another example just to increase word count.
- A shorter article with one clear route is better than a longer article that reads like a checklist.

OPENING RULE:
Start with a specific operational observation, not a generic introduction.
Do not use the same opening pattern every time.
Do not copy this example verbatim, but this is the type of opening expected:
"The first thing I usually check on a residential job is not the alarm panel. It is the side gate."

ENDING RULE:
Do not end with a sales pitch, slogan, summary, or call-to-action.
End with a practical warning, unresolved risk, or an observation the reader can test on their own property.

FINAL STYLE CHECK BEFORE RETURNING:
Before returning the JSON, silently check the article against these questions:
- Does it sound like a practitioner, not a corporate blog?
- Does it avoid fake-gritty language?
- Does it avoid checklist/report structure?
- Does it avoid formal audit-report language?
- Does it stay focused on one clear through-line?
- Are there no forced internal links in the visible article body?
- Could a real security operator plausibly say this?

If the answer to any of these is no, rewrite the article before returning it.

Current structure mode: ${structureMode}
Return ONLY valid JSON with the schema provided in the user prompt.`

const shouldRunNarrativeRewrite = (validation: ReturnType<typeof validateArticle>) =>
  validation.score < 94 ||
  validation.issues.length > 0 ||
  validation.warnings.some((warning) =>
    /report-like|checklist|category-by-category|repeated category|repetitive field phrasing|formal audit|too many issue areas|scope drift|forced internal link|markdown heading|bullet list|numbered list/i.test(warning)
  )

const buildNarrativeRewritePrompt = (article: string) => `Rewrite the article below so it no longer reads like a report, checklist, SEO article, or category-by-category security guide.

Keep operational accuracy, but do NOT preserve every point. The main job is to narrow the article until it has one route and no syllabus feel, then translate it out of formal audit-report language. Do not make it grumpy, theatrical, salesy, motivational, or polished. The voice should be calm, experienced, specific, practical, and plainspoken.

Hard scope lock:
- If the article covers more than four major security issues, cut it down before returning it.
- For a residential perimeter article, usually keep this route: side/rear gate → rear sliding door or rear access point → camera/alarm confidence gap → maintenance or household habit.
- Remove standalone paragraphs about windows, lighting, landscaping, rental properties, codes, locks, alarms, CCTV, fences, and behaviour unless they directly support that route.
- Do not give each category its own paragraph.
- Do not include a full list of possible weaknesses.

Plain-language field pass:
- Rewrite it so it sounds like a practitioner explaining the inspection to a capable homeowner or business owner, not like a formal access-control assessment.
- Replace report terms with plain words where possible: "access control point" → "place I check" or "gate"; "unauthorized access" → "someone getting in"; "cumulative failures" → "small problems stacking up"; "layered approach" → "the rest of the setup"; "vulnerability" → "weak spot".
- Avoid repeating the same field phrase. Do not start several paragraphs with "A common issue", "A common failure", "I often find", "I often encounter", "I often observe", "Frequently", "In many cases", or "In some cases".
- Limit first-person field phrasing. One or two direct observations are enough; do not make every paragraph begin with "I".

Mandatory rewrite rules:
- Make it feel like an experienced operator walking through a property, reviewing an incident, or explaining a failure pattern in sequence.
- Keep one clear through-line.
- Use 3-4 developed observations at most.
- Do not give every issue equal weight.
- Do not start paragraphs with report-style labels such as "Windows", "CCTV", "Alarm systems", "Lighting", "Landscaping", "Lastly", "For rental properties", or "Practical perimeter security".
- Remove formal audit phrases such as "access control point", "unauthorized access", "cumulative failures", "layered approach", "risk controls", "deterrence value", and "security posture" unless the article is explicitly a formal report.
- Remove headings, bullet lists, numbered sections, forced conclusions, obvious AI transitions, forced internal links, and neat summaries.
- Preserve useful specifics only where they serve the route: gate latches, rear sliding doors, anti-lift issues, strike plates, screw length, door alignment, camera angle, storage, backup batteries, ignored alerts, shared codes, and maintenance.
- Aim for 800-1000 words. Shorter and focused is better than long and comprehensive.
- End on a practical observation or warning the reader can test, not a neat summary.

Return ONLY valid JSON in this exact shape:
{
  "article": "rewritten article body",
  "content": "same as article"
}

Article to rewrite:
${article}
`


export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
  })

  // ── Auth check ──────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse request ────────────────────────────────────────────
  let body: GenerateArticleRequest & { generateImage?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { prompt, audience, tone, topic, keywords } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const hashInput = `${prompt}|${audience ?? ''}|${tone ?? ''}|${topic ?? ''}|${keywords ?? ''}`
  const hash = stableHash(hashInput)
  const structureMode = structureModes[hash % structureModes.length]
  const fallbackToneMode = toneModes[Math.floor(hash / 7) % toneModes.length]
  const appliedTone = tone?.trim() || fallbackToneMode
  const requestedCluster = resolveCluster(topic, undefined, prompt)

  const { data: availableTopics } = await adminClient
    .from('topics')
    .select('id, name, slug, parent_id')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const taxonomy = buildTopicTaxonomy((availableTopics ?? []) as TopicCandidate[])

  const { data: existingArticles } = await adminClient
    .from('articles')
    .select('title, slug, excerpt, content_cluster, pillar_topic')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(8)

  const linkCandidates = (existingArticles ?? [])
    .filter((article) => article.title && article.slug)
    .map((article) => ({
      title: String(article.title),
      slug: String(article.slug).replace(/^\/+|\/+$/g, ''),
      excerpt: article.excerpt ? String(article.excerpt) : null,
      content_cluster: article.content_cluster ? String(article.content_cluster) : null,
      pillar_topic: article.pillar_topic ? String(article.pillar_topic) : null,
    }))

  const systemPrompt = buildSystemPrompt(structureMode)

  const userPrompt = [
    audience ? `TARGET AUDIENCE: ${audience}` : '',
    `TONE MODE: ${appliedTone}`,
    topic ? `OPTIONAL USER CATEGORY GUIDANCE: ${topic}` : '',
    taxonomy ? `AVAILABLE TAXONOMY (choose the best topic_id from this list):\n${taxonomy}` : '',
    `RECOMMENDED PILLAR TOPIC: ${requestedCluster.pillar}`,
    `RECOMMENDED CONTENT CLUSTER: ${requestedCluster.cluster}`,
    keywords ? `TARGET KEYWORDS: ${keywords}` : '',
    linkCandidates.length ? `EXISTING ARTICLE CANDIDATES FOR INTERNAL LINKS (use only these slugs if relevant): ${JSON.stringify(linkCandidates)}` : 'EXISTING ARTICLE CANDIDATES FOR INTERNAL LINKS: []',
    `STRUCTURE MODE: ${structureMode}`,
    `
Return ONLY valid JSON with exactly these keys:
{
  "title": "string",
  "article": "string (Markdown article body, 800-1000 words unless requested otherwise; no headings, no bullet lists, one clear route, no category-by-category report structure, no formal audit-report language)",
  "content": "string (same as article)",
  "excerpt": "string",
  "slug": "string",
  "meta_title": "string",
  "meta_description": "string",
  "image_prompt": "string",
  "category": "string",
  "subcategory": "string",
  "topic_id": "string or null",
  "includeChecklist": boolean,
  "includeFAQ": boolean,
  "key_takeaways": ["string"],
  "checklist_items": ["string"],
  "faq_items": [{"question": "string", "answer": "string"}],
  "suggested_topic": "string",
  "keyword_suggestions": ["string"],
  "content_cluster": "string",
  "pillar_topic": "string",
  "internal_links": [{"title": "string", "slug": "string", "anchor": "string", "reason": "string"}],
  "ai_structure_mode": "string"
}
`,
    'Write the article now. Focus on operational realism, practical detail, and a measured field-informed voice. Narrow the scope to one inspection route or failure pattern. Do not cover the whole topic. Use plain practitioner language, not formal audit-report wording. No summaries, no theatrical grit, no forced internal links.',
  ]
    .filter(Boolean)
    .join('\n')

  let draft: (GeneratedArticleDraft & {
    article?: string
    image_prompt?: string
    category?: string
    subcategory?: string
    includeChecklist?: boolean
    includeFAQ?: boolean
    topic_id?: string | null
    internal_links?: InternalLinkTarget[]
    internal_link_targets?: InternalLinkTarget[]
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // High-performance model with excellent adherence to complex human-writing rules
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.82, // Enough variation for natural prose without pushing into theatrical rant mode
      max_tokens: 4200, 
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    }

    try {
      draft = JSON.parse(rawContent)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    draft.content = draft.content || draft.article || ''
    draft.article = draft.article || draft.content

    if (!draft.slug) {
      draft.slug = generateSlug(draft.title)
    }

    if (!draft.meta_title) {
      draft.meta_title = draft.title?.slice(0, 60) ?? ''
    }

    if (!draft.excerpt && draft.content) {
      draft.excerpt = draft.content.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    }

    if (!draft.meta_description) {
      draft.meta_description = draft.excerpt?.slice(0, 160) ?? ''
    }

    const topicCandidates = (availableTopics ?? []) as TopicCandidate[]
    const matchedTopic =
      topicCandidates.find((candidate) => candidate.id === draft.topic_id) ||
      findBestTopic(topicCandidates, [draft.subcategory, draft.suggested_topic, draft.category, topic, prompt])

    if (matchedTopic) {
      const parent = topicCandidates.find((candidate) => candidate.id === matchedTopic.parent_id)
      draft.topic_id = matchedTopic.id
      draft.subcategory = matchedTopic.parent_id ? matchedTopic.name : (draft.subcategory || matchedTopic.name)
      draft.category = parent?.name || draft.category || matchedTopic.name
    }

    const clusterFromDraft = resolveCluster(draft.category || topic, draft.subcategory, prompt)
    draft.content_cluster = normaliseClusterText(draft.content_cluster || clusterFromDraft.cluster)
    draft.pillar_topic = draft.pillar_topic || clusterFromDraft.pillar
    draft.ai_structure_mode = structureMode
    const parsedLinks = parseInternalLinks(draft.internal_links || draft.internal_link_targets)
    draft.internal_links = parsedLinks
    draft.internal_link_targets = parsedLinks

    draft = enforceInternalLinkInjection(draft, linkCandidates, prompt)

    // POST-GENERATION VALIDATION + OPTIONAL BACKEND STYLE REWRITE
    let validation = validateArticle(draft.content || '', 800)
    console.log(generateValidationReport(validation))

    if (shouldRunNarrativeRewrite(validation) && draft.content) {
      try {
        const rewriteCompletion = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt('article_only') },
            { role: 'user', content: buildNarrativeRewritePrompt(draft.content) },
          ],
          temperature: 0.74,
          max_tokens: 3600,
          response_format: { type: 'json_object' },
        })

        const rewriteRaw = rewriteCompletion.choices[0]?.message?.content

        if (rewriteRaw) {
          const rewritten = JSON.parse(rewriteRaw) as {
            article?: string
            content?: string
          }

          const rewrittenContent = rewritten.content || rewritten.article

          if (rewrittenContent && countWords(rewrittenContent) >= 750) {
            draft.content = rewrittenContent
            draft.article = rewrittenContent
            draft.excerpt = rewrittenContent.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
            draft.meta_description = draft.excerpt.slice(0, 160)

            validation = validateArticle(draft.content || '', 800)
            console.log('[Narrative Rewrite Applied]')
            console.log(generateValidationReport(validation))
          }
        }
      } catch (rewriteErr) {
        console.warn('Narrative rewrite skipped:', rewriteErr)
      }
    }
    
    if (draft.content) {
      const softenedContent = softenPublicArticleLanguage(draft.content)
      if (softenedContent !== draft.content) {
        draft.content = softenedContent
        draft.article = softenedContent
        draft.excerpt = softenedContent.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
        draft.meta_description = draft.excerpt.slice(0, 160)

        validation = validateArticle(draft.content || '', 800)
        console.log('[Plain Language Cleanup Applied]')
        console.log(generateValidationReport(validation))
      }
    }

    if (Array.isArray(draft.keyword_suggestions)) {
      draft.keyword_suggestions = draft.keyword_suggestions
        .map((keyword) => String(keyword).trim())
        .filter(Boolean)
        .slice(0, 8)
    } else {
      draft.keyword_suggestions = []
    }
  } catch (err: unknown) {
    console.error('OpenAI text generation error:', err)
    const message = err instanceof Error ? err.message : 'OpenAI API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

    return NextResponse.json({ draft }, { status: 200 })
  } catch (err: unknown) {
    console.error('/api/generate-article fatal error:', err)
    return jsonError(getErrorMessage(err), 500, err)
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Use POST to generate articles.' },
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json',
      }
    }
  )
}

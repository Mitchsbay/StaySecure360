// ============================================================
// /api/generate-article — Server-side OpenAI article generation
//
// REQUIRED ENVIRONMENT VARIABLES (set in Vercel or .env.local):
// OPENAI_API_KEY — Your OpenAI API key (server-side only)
// NEXT_PUBLIC_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY
// SUPABASE_SERVICE_ROLE_KEY
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
        .map((child) => ' - ' + child.name + ' [slug: ' + child.slug + ', id: ' + child.id + ']')
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

// ============================================================
// NEW MASTER SYSTEM PROMPT (Strongly Improved)
// ============================================================
const buildSystemPrompt = (structureMode: StructureMode) => `
You are an experienced security operator and risk professional writing for StaySecure360. 
Your voice is calm, direct, field-informed, and operationally credible — like someone who has spent years doing site walks, perimeter checks, incident reviews, and client audits.

CORE WRITING PHILOSOPHY:
- Sound observant and specific rather than theatrical or motivational.
- Focus on realistic failure modes: poor installation, wear and tear, human convenience overriding policy, maintenance neglect, complacency, and visibility issues.
- Prioritise "how things actually fail in practice" over generic advice.

VOICE AND TONE:
- Practical, measured, and experienced.
- Use "I" sparingly and only when it adds genuine field credibility.
- Vary sentence length and rhythm naturally. Mix short, direct observations with longer explanatory ones.
- Allow mild human asymmetry — not every point needs equal weight or perfect balance.

STRICT HUMAN WRITING RULES:
1. Maintain one clear through-line. Do not try to cover every possible issue in one article.
2. Use 3–4 developed, concrete examples at most. Explain the mechanics properly.
3. Write as continuous narrative — like walking a site or reviewing an incident.
   - NO Markdown headings in the visible article body.
   - NO numbered lists or bullet points in the visible article body.
4. Avoid repetitive paragraph starters: "One common...", "Another issue...", "Many homeowners...", "From there...", "Let's not forget...".
5. Do not force internal links into the article body. Return them only in the internal_links metadata field.
6. Prefer precise mechanical details (weak strike plate with short screws, missing anti-lift pins on sliding doors, dirty camera lenses, dead backup batteries, unlatched gates) over vague warnings.

BANNED PHRASES — NEVER USE:
- "In today's world", "It is important to note", "A comprehensive approach", "Crucial to consider", "Culture of awareness", "The key takeaway", "Ultimately", "This article explores", "Delve into", "Peace of mind", "Robust security", "Stay vigilant", "False sense of security", "chain of vulnerabilities".
- Mechanical transitions: "Furthermore", "Moreover", "Additionally", "First", "Second", "Finally".
- Fake-grit: "brutal truth", "battlefield", "Hollywood break-ins", "bad guys", "lazy thieves", "wake-up call".

LENGTH & DEPTH:
- Target 950–1200 words.
- Build depth through nuance and real mechanics, not by adding more topics.

OPENING RULE:
Start with a specific, grounded operational observation. Avoid repetitive scene-setting like "It's a quiet evening...".

ENDING RULE:
End on a practical observation, a testable risk, or a quiet warning. Never use a polished summary or motivational close.

TECHNICAL ACCURACY:
Stick to common, realistic failure modes. Avoid unsubstantiated claims about advanced attack tools unless specifically requested.

SELF-CHECK BEFORE RETURNING JSON:
Silently evaluate the article:
- Does it sound like a real security professional sharing field observations?
- Does it avoid all banned phrases and repetitive structures?
- Is the flow natural rather than checklist-like or category-by-category?
- Would this pass as human-written on StaySecure360?

If not, rewrite internally until it does.

Current structure mode: ${structureMode}
Return ONLY valid JSON matching the schema provided in the user prompt.
`

const shouldRunNarrativeRewrite = (validation: ReturnType<typeof validateArticle>) =>
  validation.score < 88 ||
  validation.issues.length > 0 ||
  validation.warnings.some((warning) =>
    /report-like|checklist|category-by-category|repeated category|forced internal link|markdown heading|bullet list|numbered list/i.test(warning)
  )

const buildNarrativeRewritePrompt = (article: string) => `Rewrite the article below so it sounds less like a report, checklist, SEO article, or category-by-category security guide.
Keep the factual content and operational accuracy. Do not make it grumpy, theatrical, salesy, motivational, or polished. The voice should be calm, experienced, specific, and practical.

Mandatory rewrite rules:
- Make it feel like an experienced operator walking through a property or explaining a failure pattern.
- Keep one clear through-line.
- Use 3-4 developed observations at most.
- Remove headings, bullet lists, numbered sections, forced conclusions, obvious AI transitions, and forced internal links.
- End on a practical observation or warning the reader can test.

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
      linkCandidates.length ? `EXISTING ARTICLE CANDIDATES FOR INTERNAL LINKS: ${JSON.stringify(linkCandidates)}` : 'EXISTING ARTICLE CANDIDATES FOR INTERNAL LINKS: []',
      `STRUCTURE MODE: ${structureMode}`,
      `
Return ONLY valid JSON with exactly these keys:
{
  "title": "string",
  "article": "string (Markdown article body, 950-1200 words; no headings, no bullet lists, natural flow)",
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
      'Write the article now. Focus on operational realism, practical detail, and a measured field-informed voice. No summaries, no theatrical grit, no forced internal links.',
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',           // Changed to more reliable model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 4200,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    }

    draft = JSON.parse(rawContent)

    draft.content = draft.content || draft.article || ''
    draft.article = draft.article || draft.content

    if (!draft.slug) draft.slug = generateSlug(draft.title)
    if (!draft.meta_title) draft.meta_title = draft.title?.slice(0, 60) ?? ''
    if (!draft.excerpt && draft.content) {
      draft.excerpt = draft.content.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    }
    if (!draft.meta_description) {
      draft.meta_description = draft.excerpt?.slice(0, 160) ?? ''
    }

    // Topic matching
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

    draft = enforceInternalLinkInjection(draft, linkCandidates, prompt)

    // POST-GENERATION VALIDATION
    let validation = validateArticle(draft.content || '', 950)
    console.log(generateValidationReport(validation))

    // Optional narrative rewrite if quality is low
    if (shouldRunNarrativeRewrite(validation) && draft.content) {
      try {
        const rewriteCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt('article_only') },
            { role: 'user', content: buildNarrativeRewritePrompt(draft.article || draft.content) },
          ],
          temperature: 0.72,
          max_tokens: 3600,
          response_format: { type: 'json_object' },
        })

        const rewriteRaw = rewriteCompletion.choices[0]?.message?.content
        if (rewriteRaw) {
          const rewritten = JSON.parse(rewriteRaw) as { article?: string; content?: string }
          const rewrittenContent = rewritten.content || rewritten.article
          if (rewrittenContent && countWords(rewrittenContent) >= 800) {
            draft.content = rewrittenContent
            draft.article = rewrittenContent
            draft.excerpt = rewrittenContent.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
            draft.meta_description = draft.excerpt.slice(0, 160)
            console.log('[Narrative Rewrite Applied]')
          }
        }
      } catch (rewriteErr) {
        console.warn('Narrative rewrite skipped:', rewriteErr)
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

    return NextResponse.json({ draft }, { status: 200 })

  } catch (err: unknown) {
    console.error('/api/generate-article fatal error:', err)
    return NextResponse.json(
      { error: getErrorMessage(err) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Use POST to generate articles.' },
    {
      status: 405,
      headers: { 'Allow': 'POST' }
    }
  )
}
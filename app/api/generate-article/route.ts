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
import { validateArticle, generateValidationReport } from '@/lib/article-validation'
import type { GenerateArticleRequest, GeneratedArticleDraft, InternalLinkTarget } from '@/types'

type StructureMode =
  | 'article_only'
  | 'article_with_short_checklist'
  | 'article_with_short_faq'
  | 'article_with_checklist_and_faq'

const structureModes: StructureMode[] = [
  'article_only',
  'article_with_short_checklist',
  'article_with_short_faq',
  'article_with_checklist_and_faq',
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
  'neutral operator',
  'direct but measured',
  'client-facing advisory',
  'blunt practical warning',
  'reflective practitioner',
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


const articleContainsInternalLinks = (content?: string | null) =>
  Boolean(content && /\[[^\]]+\]\(\/articles\/[^)]+\)/.test(content))

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

  const scored = candidates.map((candidate) => {
    const candidateText = normaliseName([
      candidate.title,
      candidate.excerpt,
      candidate.content_cluster,
      candidate.pillar_topic,
    ].filter(Boolean).join(' '))
    const candidateWords = new Set(candidateText.split(' ').filter((word) => word.length > 3))
    const score = haystack.split(' ').filter((word) => word.length > 3 && candidateWords.has(word)).length
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

const injectMarkdownLinks = (
  content: string,
  targets: InternalLinkTarget[]
) => {
  const usableTargets = targets.slice(0, 2)
  if (!content || content.length < 800 || usableTargets.length === 0 || articleContainsInternalLinks(content)) return content

  const patterns = [
    (anchor: string, slug: string) => `I've seen similar patterns discussed in [${anchor}](/articles/${slug}).`,
    (anchor: string, slug: string) => `It's worth looking at [${anchor}](/articles/${slug}) to see how this plays out elsewhere.`,
    (anchor: string, slug: string) => `I often reference [${anchor}](/articles/${slug}) when explaining this specific gap.`,
    (anchor: string, slug: string) => `The failure mode here is remarkably similar to what I found in [${anchor}](/articles/${slug}).`,
    (anchor: string, slug: string) => `For a broader look at this, see [${anchor}](/articles/${slug}).`,
  ]

  const paragraphs = content.split(/\n\n+/)
  let linkIndex = 0

  const linkedParagraphs = paragraphs.map((paragraph, paragraphIndex) => {
    if (linkIndex >= usableTargets.length) return paragraph

    const trimmed = paragraph.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('- ') || /^\d+\./.test(trimmed)) return paragraph
    if (trimmed.length < 180 || /^(FAQ|Checklist|Quick Checklist)/i.test(trimmed)) return paragraph
    if (paragraphIndex === 0 && paragraphs.length > 3) return paragraph

    const target = usableTargets[linkIndex]
    const slug = target.slug.replace(/^\/+|\/+$/g, '')
    const anchor = target.anchor || buildInternalLinkAnchor(target.title)
    const sentenceParts = paragraph.split(/(?<=[.!?])\s+/)
    const sentenceIndex = sentenceParts.findIndex((sentence) => sentence.length > 90 && !sentence.includes('](/articles/'))
    if (sentenceIndex === -1) return paragraph

    const pattern = patterns[(paragraphIndex + linkIndex) % patterns.length]
    sentenceParts[sentenceIndex] = `${sentenceParts[sentenceIndex]} ${pattern(anchor, slug)}`
    linkIndex += 1
    return sentenceParts.join(' ')
  })

  return linkedParagraphs.join('\n\n')
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

  if (!articleContainsInternalLinks(draft.content)) {
    draft.content = injectMarkdownLinks(draft.content, targets)
    draft.article = draft.content
  }

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

const buildSystemPrompt = (structureMode: StructureMode) => `You are a grizzled, no-nonsense security professional writing for StaySecure360. You've spent 20 years in the field—not in an office, but on-site, fixing physical security gaps, auditing workplace risks, and seeing exactly how people bypass "secure" systems.

You are NOT an AI. You are NOT a blogger. You are NOT a marketer.

CORE WRITING PHILOSOPHY:
Write like a human who is tired of seeing the same mistakes. Use a voice that is grounded, slightly cynical, and deeply practical. Your goal is to share "the real world" version of security, not the textbook version.

VOICE AND TONE:
- Professional but gritty.
- Direct, blunt, and measured.
- Opinionated based on experience.
- Use "I," "me," and "my" to share specific (fictionalized but realistic) anecdotes.
- Avoid "polite" AI transitions.

HUMAN WRITING RULES (CRITICAL FOR UNDETECTABILITY):
1. VARIATION: Aggressively vary sentence length. Use short, punchy sentences (3-5 words) followed by longer, more complex observations.
2. ROUGHNESS: Do not use smooth transitions like "Furthermore," "Moreover," "Additionally," or "In addition." A human just starts the next thought.
3. FRAGMENTS: Use occasional sentence fragments for emphasis. "Not good." "Every single time."
4. NO RECAPS: Never summarize what you just said. If you made the point, move on.
5. NO SLOGANS: Avoid "quote-worthy" or "inspiring" lines. Real security is messy, not a motivational poster.
6. NO INTRO HOOKS: Do NOT start with "It's a quiet evening..." or "Imagine a scenario..." Start with a blunt observation or a specific failure you saw.
7. NO CONCLUSIONS: Do NOT end with a summary or "In conclusion." End on a final practical observation or a warning. The article should feel like you stopped writing because you finished your point.

ANTI-STRUCTURE RULE:
- No Markdown headings (##, ###). Use paragraph breaks to separate ideas.
- If the article feels like it needs a heading, your narrative isn't strong enough. Rewrite it to flow naturally.
- Exception: FAQ/Checklist if explicitly requested, but keep them conversational.

BANNED AI PHRASES:
- "In today's world", "In conclusion", "It is important to note", "A comprehensive approach", "Delve into", "Peace of mind", "Robust security", "The reality is", "When it comes to", "Crucial to consider", "Stay vigilant", "Culture of awareness".
- Avoid any phrase that sounds like a "best practice" summary.

ANECDOTE RULES:
- Share "field notes." Instead of "I once saw a bad lock," say "I walked into a warehouse in an industrial park last Tuesday where the 'high-security' deadbolt was literally held in by two rusted screws. The owner had no idea."
- Be specific about the *mechanics* of failure, not just the concept.

WORD COUNT AND DEPTH:
- Aim for 1000+ words. 
- If you run out of things to say, dive deeper into the *psychology* of why people take shortcuts, or the *technical specifics* of a hardware failure. 
- Do NOT pad with filler.

Current structure mode: ${structureMode}
Return ONLY valid JSON with the schema provided in the user prompt.`

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
  "article": "string (Markdown article body, 1000+ words, no headings, natural flow)",
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
    'Write the article now. Focus on the raw, unpolished practitioner voice. No summaries. No introductions. Just real field experience.',
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
      temperature: 1.0, // Increased for more variance and less predictable (AI-like) patterns
      max_tokens: 4000, 
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

    // POST-GENERATION VALIDATION
    const validation = validateArticle(draft.content || '', 1000)
    console.log(generateValidationReport(validation))
    
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

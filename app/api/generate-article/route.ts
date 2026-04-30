// ============================================================
// /api/generate-article — Server-side OpenAI article generation
//
// REQUIRED ENVIRONMENT VARIABLES:
// OPENAI_API_KEY — Your OpenAI API key (server-side only)
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

const structureModes: StructureMode[] = ['article_only']

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
  'Perimeter Security': { pillar: 'Physical Security', cluster: 'perimeter-security' },
  'Workplace Awareness': { pillar: 'Workplace Awareness', cluster: 'human-behaviour-risk' },
  'Digital Threats': { pillar: 'Digital Threats', cluster: 'digital-risk-basics' },
  'Remote Work Security': { pillar: 'Remote Work Security', cluster: 'remote-work-network-risk' },
  'Social Engineering': { pillar: 'Social Engineering', cluster: 'social-engineering-patterns' },
}

const toneModes = [
  'operational and realistic',
  'direct but measured',
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
    .slice(0, 3)
}

const cleanInternalLinkTitle = (title: string) =>
  String(title || '').replace(/^to\s+/i, '').replace(/\s+/g, ' ').trim()

const enforceInternalLinkInjection = (
  draft: GeneratedArticleDraft & { internal_links?: InternalLinkTarget[]; internal_link_targets?: InternalLinkTarget[] },
  candidates: Array<{ title: string; slug: string; excerpt?: string | null }>,
  prompt: string
) => {
  if (!draft.content || candidates.length === 0) return draft

  const targets = parseInternalLinks(draft.internal_links || draft.internal_link_targets)
  draft.internal_links = targets.length > 0 ? targets : []
  draft.internal_link_targets = targets.length > 0 ? targets : []
  return draft
}

const getErrorMessage = (err: unknown, fallback = 'Article generation failed') => {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err.trim()) return err
  return fallback
}

// ============================================================
// TIGHTER MASTER SYSTEM PROMPT (Refined based on latest output)
// ============================================================
const buildSystemPrompt = (structureMode: StructureMode) => `
You are a seasoned security operator writing for StaySecure360. 
Write like someone who has done hundreds of real site inspections and risk assessments — calm, direct, specific, and practical. No marketing tone, no motivational language, no polished corporate phrasing.

STRICT WRITING RULES:
- Focus on 3–4 concrete mechanical failures. Explain how they actually fail in practice.
- Write as a natural, flowing narrative — like you're walking the property and pointing things out as you go.
- Vary sentence starters strongly. Never use repetitive patterns like "One frequent...", "Another frequent issue...", "Equally concerning...", "I also observe...", "As I walk...".
- Use "I" sparingly and only when it feels natural. Avoid overusing "I often encounter", "I frequently find", "During my assessments".
- Prefer raw mechanical details (short screws in strike plates, missing anti-lift pins, dirty lenses, dead batteries, unlatched gates) over general statements.

BANNED PHRASES & PATTERNS — NEVER USE:
- "One frequent sight", "Equally concerning", "Another frequent issue", "I also observe", "As I walk through"
- "rendering... useless", "substantially enhance", "proactive maintenance schedule", "create a more resilient defense", "stack up", "lead to significant security failures"
- "false sense of security", "chain of vulnerabilities", "more often than not"
- Mechanical transitions: "Moreover", "Additionally", "Equally", "Another"

OPENING:
Start with a specific, grounded observation from the field.

ENDING:
End on a quiet, practical note or testable observation. No summaries, no conclusions, no motivational closes.

SELF-CHECK BEFORE OUTPUTTING:
- Does this read like a real person walking and talking through a property?
- Are the paragraph starters varied and natural?
- Is there any checklist-like or systematic structure?
- Have I avoided all banned phrases?

Current structure mode: ${structureMode}
Return ONLY valid JSON matching the exact schema in the user prompt.
`

const shouldRunNarrativeRewrite = (validation: ReturnType<typeof validateArticle>) =>
  validation.score < 90 ||
  validation.issues.length > 0 ||
  validation.warnings.some((w) =>
    /report-like|checklist|repetitive|category-by-category|forced|heading|bullet|transition/i.test(w)
  )

const buildNarrativeRewritePrompt = (article: string) => `Rewrite this article to sound more natural and less like structured AI content.

Keep all factual details and mechanical observations, but make the flow feel like a seasoned operator casually walking the property and explaining what they see.

Rules:
- Make paragraph starters varied and human.
- Remove any repetitive or list-like structure.
- Eliminate corporate or polished phrasing.
- Keep it calm, specific, and practical.
- End on a grounded observation, not a conclusion.

Return ONLY this JSON:
{
  "article": "fully rewritten article",
  "content": "same as article"
}

Article:
${article}
`

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '',
    })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { prompt, audience, tone, topic, keywords } = body

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const hashInput = `${prompt}|${audience ?? ''}|${tone ?? ''}|${topic ?? ''}|${keywords ?? ''}`
    const hash = stableHash(hashInput)

    const structureMode = structureModes[hash % structureModes.length]
    const appliedTone = tone?.trim() || 'operational and realistic'

    const requestedCluster = resolveCluster(topic, undefined, prompt)

    const { data: availableTopics } = await adminClient
      .from('topics')
      .select('id, name, slug, parent_id')
      .order('sort_order', { ascending: true })

    const taxonomy = buildTopicTaxonomy((availableTopics ?? []) as TopicCandidate[])

    const { data: existingArticles } = await adminClient
      .from('articles')
      .select('title, slug, excerpt')
      .eq('status', 'published')
      .limit(6)

    const linkCandidates = (existingArticles ?? []).map(a => ({
      title: String(a.title),
      slug: String(a.slug).replace(/^\/+|\/+$/g, ''),
      excerpt: a.excerpt ? String(a.excerpt) : null,
    }))

    const systemPrompt = buildSystemPrompt(structureMode)

    const userPrompt = [
      audience ? `TARGET AUDIENCE: ${audience}` : '',
      `TONE: ${appliedTone}`,
      topic ? `CATEGORY GUIDANCE: ${topic}` : '',
      taxonomy ? `AVAILABLE TOPICS:\n${taxonomy}` : '',
      `RECOMMENDED CLUSTER: ${requestedCluster.cluster}`,
      keywords ? `KEYWORDS: ${keywords}` : '',
      `STRUCTURE MODE: ${structureMode}`,
      `Return ONLY valid JSON with these exact keys: title, article, content, excerpt, slug, meta_title, meta_description, image_prompt, category, subcategory, topic_id, includeChecklist, includeFAQ, key_takeaways, checklist_items, faq_items, suggested_topic, keyword_suggestions, content_cluster, pillar_topic, internal_links, ai_structure_mode`,
    ].filter(Boolean).join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.73,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    let draft = JSON.parse(completion.choices[0]?.message?.content || '{}') as GeneratedArticleDraft & any

    draft.content = draft.content || draft.article || ''
    draft.article = draft.article || draft.content

    if (!draft.slug) draft.slug = generateSlug(draft.title || 'untitled')
    if (!draft.meta_title) draft.meta_title = (draft.title || '').slice(0, 60)
    if (!draft.excerpt) {
      draft.excerpt = draft.content.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    }
    if (!draft.meta_description) draft.meta_description = draft.excerpt

    // Topic resolution
    const topicCandidates = (availableTopics ?? []) as TopicCandidate[]
    const matchedTopic = findBestTopic(topicCandidates, [draft.subcategory, draft.suggested_topic, draft.category, topic, prompt])
    if (matchedTopic) draft.topic_id = matchedTopic.id

    draft.content_cluster = normaliseClusterText(draft.content_cluster || requestedCluster.cluster)
    draft.pillar_topic = draft.pillar_topic || requestedCluster.pillar
    draft.ai_structure_mode = structureMode

    draft = enforceInternalLinkInjection(draft, linkCandidates, prompt)

    // Validation & optional rewrite
    let validation = validateArticle(draft.content || '', 950)
    console.log(generateValidationReport(validation))

    if (shouldRunNarrativeRewrite(validation) && draft.content) {
      try {
        const rewriteCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt('article_only') },
            { role: 'user', content: buildNarrativeRewritePrompt(draft.article || draft.content) },
          ],
          temperature: 0.68,
          max_tokens: 3500,
          response_format: { type: 'json_object' },
        })

        const rewritten = JSON.parse(rewriteCompletion.choices[0]?.message?.content || '{}')
        if (rewritten.article && countWords(rewritten.article) > 800) {
          draft.article = rewritten.article
          draft.content = rewritten.article
          console.log('[Narrative Rewrite Applied]')
        }
      } catch (e) {
        console.warn('Rewrite failed:', e)
      }
    }

    return NextResponse.json({ draft })

  } catch (err: unknown) {
    console.error('Article generation error:', err)
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed. Use POST.' }, { status: 405 })
}
// ============================================================
// /api/generate-article — Server-side OpenAI article generation
// ============================================================

export const dynamic = 'force-dynamic'
export const maxDuration = 180

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { validateArticle, generateValidationReport, countWords } from '@/lib/article-validation'
import type { GenerateArticleRequest, GeneratedArticleDraft, InternalLinkTarget } from '@/types'

type StructureMode = 'article_only' | 'article_with_short_checklist' | 'article_with_short_faq' | 'article_with_checklist_and_faq'

const structureModes: StructureMode[] = ['article_only']

type TopicCandidate = {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

const normaliseName = (input?: string | null) =>
  input?.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim() || ''

const findBestTopic = (topics: TopicCandidate[], names: Array<string | null | undefined>): TopicCandidate | null => {
  const childTopics = topics.filter((t) => t.parent_id)
  const allTopics = [...childTopics, ...topics.filter((t) => !t.parent_id)]

  for (const name of names) {
    const normalised = normaliseName(name)
    if (!normalised) continue

    const direct = allTopics.find((t) => 
      normaliseName(t.name) === normalised || normaliseName(t.slug) === normalised
    )
    if (direct) return direct

    const partial = childTopics.find((t) => {
      const tn = normaliseName(t.name)
      return tn && (normalised.includes(tn) || tn.includes(normalised))
    })
    if (partial) return partial
  }
  return null
}

const buildTopicTaxonomy = (topics: TopicCandidate[]) => {
  const parents = topics.filter((t) => !t.parent_id)
  return parents
    .map((parent) => {
      const children = topics
        .filter((t) => t.parent_id === parent.id)
        .map((c) => ` - ${c.name} [slug: ${c.slug}, id: ${c.id}]`)
        .join('\n')
      return children 
        ? `- ${parent.name} [slug: ${parent.slug}, id: ${parent.id}]\n${children}`
        : `- ${parent.name} [slug: ${parent.slug}, id: ${parent.id}]`
    })
    .join('\n')
}

const contentClusterMap: Record<string, { pillar: string; cluster: string }> = {
  'Physical Security': { pillar: 'Physical Security', cluster: 'physical-security-practice' },
  'Access Control': { pillar: 'Physical Security', cluster: 'access-control-failures' },
  'Perimeter Security': { pillar: 'Physical Security', cluster: 'perimeter-security' },
  'Workplace Awareness': { pillar: 'Workplace Awareness', cluster: 'human-behaviour-risk' },
  'Digital Threats': { pillar: 'Digital Threats', cluster: 'digital-risk-basics' },
  'Remote Work Security': { pillar: 'Remote Work Security', cluster: 'remote-work-network-risk' },
  'Social Engineering': { pillar: 'Social Engineering', cluster: 'social-engineering-patterns' },
}

const stableHash = (input: string) =>
  Array.from(input).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)

const normaliseClusterText = (input?: string | null) =>
  input?.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'general-security'

const resolveCluster = (category?: string | null, subcategory?: string | null, prompt?: string | null) => {
  const mapped = (subcategory && contentClusterMap[subcategory]) || (category && contentClusterMap[category])
  if (mapped) return mapped
  return { pillar: category || 'Security Awareness', cluster: normaliseClusterText(prompt) }
}

const parseInternalLinks = (value: unknown): InternalLinkTarget[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((link): link is InternalLinkTarget => Boolean(link && typeof link === 'object' && 'slug' in link && 'title' in link))
    .map((link) => ({
      title: String(link.title).slice(0, 120),
      slug: String(link.slug).replace(/^\/+|\/+$/g, ''),
      anchor: String(link.anchor || '').slice(0, 80),
      reason: link.reason ? String(link.reason).slice(0, 180) : undefined,
    }))
    .slice(0, 3)
}

const enforceInternalLinkInjection = (draft: any, candidates: any[]) => {
  if (!draft) return draft
  const targets = parseInternalLinks(draft.internal_links || draft.internal_link_targets)
  draft.internal_links = targets
  draft.internal_link_targets = targets
  return draft
}

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message
  return String(err || 'Unknown error')
}

// ============================================================
// MASTER SYSTEM PROMPT v4.1
// ============================================================
const buildSystemPrompt = (structureMode: StructureMode) => `
You are a seasoned security operator writing for StaySecure360. 
Write like an experienced practitioner doing real site walks — calm, direct, specific, and practical. No marketing, no hype, no corporate language.

Rules:
- Pick 3–4 concrete mechanical issues and describe how they actually fail.
- Write naturally, like you're walking the property and commenting on what you notice.
- Vary paragraph starters a lot. No repetitive patterns.
- Use "I" only when it feels natural and sparse.
- Be specific with details (short screws, missing pins, worn mechanisms, overgrown fences, etc.).

Banned:
- Any walking-tour phrasing ("Stepping onto", "the first thing", "Next,", "Then there's", "Moving to", "Additionally", "Furthermore", "Finally")
- Polished language ("red flag", "minimal effort", "dramatically improve", "clear signal", "alarmingly easy")

Start directly with a specific observation.
End on a quiet, practical note.

Self-check: Make sure it feels like real field notes, not a report.

Current structure mode: ${structureMode}
Return ONLY valid JSON.
`

const shouldRunNarrativeRewrite = (validation: any) =>
  validation.score < 90 || validation.issues.length > 0

const buildNarrativeRewritePrompt = (article: string) => `Rewrite this article to sound like genuine field observations from an experienced security operator.

Make the flow natural and conversational. Remove all list-like or walking-tour structure. Vary starters heavily. Keep it calm and specific.

Return ONLY this JSON:
{
  "article": "rewritten article",
  "content": "same as article"
}

Article:
${article}
`

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })

    // Auth
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt('article_only')

    const userPrompt = `Topic: ${prompt}\nWrite a natural, practical article following all rules in the system prompt.`

    console.log('[Generate] Starting OpenAI call for prompt:', prompt.substring(0, 100) + '...')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.72,
      max_tokens: 3800,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      console.error('No content returned from OpenAI')
      return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    }

    console.log('[Generate] Raw response length:', rawContent.length)

    let draft: any
    try {
      draft = JSON.parse(rawContent)
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr)
      return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 })
    }

    // Safe content handling
    draft.content = typeof draft.content === 'string' ? draft.content.trim() : ''
    draft.article = typeof draft.article === 'string' ? draft.article.trim() : draft.content

    if (!draft.article) {
      console.error('No article content in draft')
      return NextResponse.json({ error: 'Generated article is empty' }, { status: 500 })
    }

    if (!draft.title) draft.title = 'Untitled Security Article'
    if (!draft.slug) draft.slug = generateSlug(draft.title)
    if (!draft.excerpt) {
      draft.excerpt = draft.article.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    }

    // Rest of processing (topic, cluster, links, validation, rewrite)
    const requestedCluster = resolveCluster(undefined, undefined, prompt)
    draft.content_cluster = normaliseClusterText(draft.content_cluster || requestedCluster.cluster)
    draft.pillar_topic = draft.pillar_topic || requestedCluster.pillar
    draft.ai_structure_mode = 'article_only'

    // Validation
    const validation = validateArticle(draft.article, 950)
    console.log(generateValidationReport(validation))

    return NextResponse.json({ draft })

  } catch (err: unknown) {
    console.error('Full generation error:', err)
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed. Use POST.' }, { status: 405 })
}
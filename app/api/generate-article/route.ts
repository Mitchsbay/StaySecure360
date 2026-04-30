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
  return parents.map((parent) => {
    const children = topics
      .filter((t) => t.parent_id === parent.id)
      .map((c) => ` - ${c.name} [slug: ${c.slug}, id: ${c.id}]`)
      .join('\n')
    return children 
      ? `- ${parent.name} [slug: ${parent.slug}, id: ${parent.id}]\n${children}`
      : `- ${parent.name} [slug: ${parent.slug}, id: ${parent.id}]`
  }).join('\n')
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

const enforceInternalLinkInjection = (draft: any, candidates: any[], prompt: string) => {
  if (!draft.content || candidates.length === 0) return draft
  const targets = parseInternalLinks(draft.internal_links || draft.internal_link_targets)
  draft.internal_links = targets
  draft.internal_link_targets = targets
  return draft
}

const getErrorMessage = (err: unknown, fallback = 'Article generation failed') => {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return fallback
}

// ============================================================
// MASTER SYSTEM PROMPT v4 — Further tightened
// ============================================================
const buildSystemPrompt = (structureMode: StructureMode) => `
You are a seasoned security operator writing for StaySecure360. 
Write like an experienced practitioner doing a real site walk — calm, direct, specific, and practical. No marketing, no corporate polish, no motivational language.

Key Rules:
- Focus on 3–4 concrete, mechanical issues. Describe how they actually fail with specific details.
- Write naturally, like you're walking and talking through the property. 
- Vary paragraph starters strongly. Never use predictable patterns such as "Next,", "Then there's", "Another", "Additionally", "Moving to", "Finally".
- Use "I" sparingly and only when it feels authentic.
- Prefer raw observations over general statements.

Strictly Banned:
- Walking tour language: "Stepping onto", "the first thing that catches my eye", "Next,", "Then there's", "Moving to", "Additionally", "Furthermore", "Finally"
- Polished phrases: "it’s a red flag", "with minimal effort", "without making much noise", "dramatically improve", "clear signal", "rendering ineffective", "alarmingly easy"

Opening:
Start directly with a specific observation.

Ending:
Stop on a quiet, practical note. No summaries.

Self-check before returning:
- Does this feel like real spoken field notes?
- Are paragraph starters varied and unpredictable?
- Is there any list-like or walking-tour structure?
- Have I avoided all banned patterns?

Current structure mode: ${structureMode}
Return ONLY valid JSON.
`

const buildNarrativeRewritePrompt = (article: string) => `Rewrite this article to sound like authentic field observations from an experienced security operator.

Make it flow naturally. Remove all walking-tour structure, predictable transitions, and polished language. Vary sentence starters heavily. Keep it calm, specific, and practical.

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

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: GenerateArticleRequest = await request.json()
    const { prompt, audience, tone, topic, keywords } = body

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const hashInput = `${prompt}|${audience ?? ''}|${tone ?? ''}|${topic ?? ''}|${keywords ?? ''}`
    const hash = stableHash(hashInput)

    const structureMode = structureModes[hash % structureModes.length]

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

    const userPrompt = `Topic: ${prompt}
${audience ? `Audience: ${audience}` : ''}
Tone: ${tone || 'operational and realistic'}
${taxonomy ? `Available topics:\n${taxonomy}` : ''}
Write a natural, field-informed article following all system prompt rules.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.69,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    let draft = JSON.parse(completion.choices[0]?.message?.content || '{}')

    draft.content = draft.content || draft.article || ''
    draft.article = draft.article || draft.content

    if (!draft.slug) draft.slug = generateSlug(draft.title || 'untitled')
    if (!draft.excerpt && draft.content) {
      draft.excerpt = draft.content.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    }
    if (!draft.meta_description) draft.meta_description = draft.excerpt || ''

    const topicCandidates = (availableTopics ?? []) as TopicCandidate[]
    const matchedTopic = findBestTopic(topicCandidates, [draft.subcategory, draft.suggested_topic, draft.category, topic, prompt])
    if (matchedTopic) draft.topic_id = matchedTopic.id

    draft.content_cluster = normaliseClusterText(draft.content_cluster || requestedCluster.cluster)
    draft.pillar_topic = draft.pillar_topic || requestedCluster.pillar
    draft.ai_structure_mode = structureMode

    draft = enforceInternalLinkInjection(draft, linkCandidates, prompt)

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
          temperature: 0.64,
          max_tokens: 3500,
          response_format: { type: 'json_object' },
        })

        const rewritten = JSON.parse(rewriteCompletion.choices[0]?.message?.content || '{}')
        if (rewritten.article && countWords(rewritten.article) > 850) {
          draft.article = rewritten.article
          draft.content = rewritten.article
          console.log('[Narrative Rewrite Applied]')
        }
      } catch (e) {
        console.warn('Rewrite skipped', e)
      }
    }

    return NextResponse.json({ draft })

  } catch (err: unknown) {
    console.error('Generation error:', err)
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed. Use POST.' }, { status: 405 })
}
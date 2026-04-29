// ============================================================
// /api/generate-seo-meta — Server-side OpenAI SEO metadata generation
//
// Generates only meta_title and meta_description from the current
// article fields. This lets editors regenerate SEO metadata without
// rewriting the article body, excerpt, image, or any other content.
// ============================================================
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'

type GenerateSeoMetaRequest = {
  title?: string
  excerpt?: string | null
  content?: string | null
  topic?: string | null
}

type SeoMetaResponse = {
  meta_title: string
  meta_description: string
}

const trimToLength = (value: string, max: number) => {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).trimEnd()
}

export async function POST(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
  })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
  }

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
  let body: GenerateSeoMetaRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const title = body.title?.trim() ?? ''
  const excerpt = body.excerpt?.trim() ?? ''
  const content = body.content?.trim() ?? ''
  const topic = body.topic?.trim() ?? ''

  if (!title && !excerpt && !content) {
    return NextResponse.json(
      { error: 'Add a title, excerpt, or article body before generating SEO metadata.' },
      { status: 400 }
    )
  }

  const systemPrompt = `You create concise SEO metadata for StaySecure360 security education articles.

Return ONLY valid JSON with exactly these keys:
{
  "meta_title": "string",
  "meta_description": "string"
}

Rules:
- meta_title must be no more than 60 characters.
- meta_description must be no more than 155 characters.
- Use Australian English.
- Be clear, professional, and specific.
- Do not use hype, clickbait, emojis, quotation marks inside values, or unverifiable claims.
- Do not invent statistics, credentials, incidents, or services.
- Base the metadata only on the supplied article content.
- Prefer practical security, workplace awareness, risk management, cyber safety, or physical security wording when relevant.`

  const userPrompt = [
    'Create SEO metadata for this article.',
    topic ? `Topic/category: ${topic}` : '',
    title ? `Article title: ${title}` : '',
    excerpt ? `Excerpt: ${excerpt}` : '',
    content ? `Article body:\n${content.slice(0, 7000)}` : '',
  ].filter(Boolean).join('\n\n')

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 250,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json({ error: 'No SEO metadata generated' }, { status: 500 })
    }

    let parsed: Partial<SeoMetaResponse>
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      return NextResponse.json({ error: 'Failed to parse SEO metadata response' }, { status: 500 })
    }

    const metaTitle = trimToLength(parsed.meta_title ?? title, 60)
    const metaDescription = trimToLength(parsed.meta_description ?? excerpt ?? title, 155)

    if (!metaTitle || !metaDescription) {
      return NextResponse.json({ error: 'Generated SEO metadata was incomplete' }, { status: 500 })
    }

    return NextResponse.json(
      { meta_title: metaTitle, meta_description: metaDescription },
      { status: 200 }
    )
  } catch (err: unknown) {
    console.error('OpenAI SEO metadata generation error:', err)
    const message = err instanceof Error ? err.message : 'OpenAI API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

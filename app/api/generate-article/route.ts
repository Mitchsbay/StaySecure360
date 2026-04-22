// ============================================================
// /api/generate-article — Server-side OpenAI article + image generation
//
// REQUIRED ENVIRONMENT VARIABLES (set in Vercel or .env.local):
//   OPENAI_API_KEY              — Your OpenAI API key (server-side only)
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY   — For uploading images to Supabase Storage
//
// OPTIONAL:
//   GENERATE_IMAGES=false       — Set to "false" to disable image generation globally
//
// HOW IT WORKS:
//   The client calls this endpoint ONCE for text generation (fast, ~5-10s).
//   If the user requested an image, the client makes a SECOND call to
//   /api/generate-image with the image_prompt from the first response.
//   This split prevents mobile connections from timing out on a single
//   long-running request that combines GPT + DALL-E (can take 30-60s).
//
// This route is protected by Supabase session auth.
// The OPENAI_API_KEY is NEVER exposed to the client.
// ============================================================
export const dynamic = 'force-dynamic'
// Vercel Hobby: 60s max. Pro/Business: 300s max.
// Set to 60s — text generation alone is well within this limit.
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import type { GenerateArticleRequest, GeneratedArticleDraft } from '@/types'

export async function POST(request: NextRequest) {
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

  // ── Build system prompt ──────────────────────────────────────
  const systemPrompt = `You are an expert security education writer for StaySecure360, a platform covering both digital and physical security threats.

Your writing style is:
- Professional, clear, and accessible to non-technical readers
- Practical and actionable — focused on real-world scenarios
- Educational without being alarmist
- Well-structured with clear headings

You must return a JSON object with EXACTLY this structure:
{
  "title": "string — compelling article title",
  "slug": "string — URL-safe slug",
  "meta_title": "string — SEO title under 60 chars",
  "meta_description": "string — SEO description under 160 chars",
  "excerpt": "string — 2-3 sentence summary",
  "content": "string — full article body in Markdown (800-1200 words, use ## and ### headings, **bold** for key terms)",
  "image_prompt": "string — a concise DALL-E image generation prompt for a professional hero image that represents this article topic. Style: clean flat illustration, corporate/professional, no text, no people's faces, security theme. Example: 'A clean flat illustration of a padlock on a digital network grid, blue and white colour palette, corporate style, no text'",
  "key_takeaways": ["string", "string", "string"],
  "checklist_items": ["string", "string", "string", "string", "string"],
  "faq_items": [
    {"question": "string", "answer": "string"},
    {"question": "string", "answer": "string"},
    {"question": "string", "answer": "string"}
  ],
  "suggested_topic": "string — one of: Social Engineering, Physical Security, Digital Threats, Remote Work Security, Workplace Awareness",
  "keyword_suggestions": ["string", "string", "string", "string", "string"]
}

Return ONLY valid JSON. No markdown code blocks. No extra text.`

  const userPrompt = [
    `Write a security education article about: ${prompt}`,
    audience ? `Target audience: ${audience}` : '',
    tone ? `Tone: ${tone}` : '',
    topic ? `Security category: ${topic}` : '',
    keywords ? `Target keywords: ${keywords}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // ── Step 1: Generate article text only ───────────────────────
  // Image generation is now handled by a separate /api/generate-image call
  // from the client. This keeps this endpoint fast and within timeout limits
  // on mobile connections and Vercel Hobby tier.
  let draft: GeneratedArticleDraft & { image_prompt?: string }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
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

    if (!draft.slug) {
      draft.slug = generateSlug(draft.title)
    }
  } catch (err: unknown) {
    console.error('OpenAI text generation error:', err)
    const message = err instanceof Error ? err.message : 'OpenAI API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Return draft only — image is generated separately via /api/generate-image
  return NextResponse.json({ draft }, { status: 200 })
}

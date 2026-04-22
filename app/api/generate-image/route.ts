// ============================================================
// /api/generate-image — DALL-E 3 image generation + Supabase Storage upload
//
// Called SEPARATELY from /api/generate-article so that:
//   1. Text generation completes quickly (mobile-friendly)
//   2. Image generation (30-60s) runs as a second, independent request
//   3. If image generation times out or fails, the article text is unaffected
//   4. The user sees the article draft immediately and waits only for the image
//
// REQUIRED ENVIRONMENT VARIABLES:
//   OPENAI_API_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY
//
// OPTIONAL:
//   GENERATE_IMAGES=false  — Globally disables image generation
// ============================================================
export const dynamic = 'force-dynamic'
// DALL-E 3 can take 30-60s on its own. Set to 90s to give it headroom.
// Vercel Pro/Business supports up to 300s; Hobby is capped at 60s.
// If on Hobby tier, image generation may still time out — the client
// handles this gracefully and shows a retry option.
export const maxDuration = 90

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
  let body: { imagePrompt: string; slug: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { imagePrompt, slug } = body

  if (!imagePrompt?.trim()) {
    return NextResponse.json({ error: 'imagePrompt is required' }, { status: 400 })
  }

  if (!slug?.trim()) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  // Check global kill-switch
  if (process.env.GENERATE_IMAGES === 'false') {
    return NextResponse.json({ error: 'Image generation is disabled on this server' }, { status: 403 })
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
  })

  // ── DALL-E 3 generation ──────────────────────────────────────
  try {
    const dallePrompt = `${imagePrompt}. Professional corporate illustration style, flat design, clean background, suitable for a business security website. No text, no words, no letters in the image.`

    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: dallePrompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'b64_json',
    })

    const b64Image = imageResponse.data?.[0]?.b64_json
    if (!b64Image) {
      return NextResponse.json({ error: 'No image data returned from DALL-E' }, { status: 500 })
    }

    // ── Upload to Supabase Storage ───────────────────────────────
    const imageBuffer = Buffer.from(b64Image, 'base64')
    const fileName = `${slug}-${Date.now()}.png`

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('article-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Image generated but upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('article-images')
      .getPublicUrl(uploadData.path)

    return NextResponse.json({ featuredImageUrl: urlData.publicUrl }, { status: 200 })
  } catch (err: unknown) {
    console.error('DALL-E image generation error:', err)
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

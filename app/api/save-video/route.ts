// ============================================================
// /api/save-video — Save a YouTube video as a draft article
//
// Creates a new article record with the YouTube video embedded.
// The article is saved as a draft so the admin can review and
// add content before publishing.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'

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

  // ── Parse body ───────────────────────────────────────────────
  let body: {
    videoId: string
    title: string
    description: string
    channelTitle: string
    topicId?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { videoId, title, description, channelTitle, topicId } = body

  if (!videoId || !title) {
    return NextResponse.json({ error: 'videoId and title are required' }, { status: 400 })
  }

  // ── Generate a unique slug ───────────────────────────────────
  let slug = generateSlug(title)

  // Check for slug collision and append suffix if needed
  const { data: existing } = await adminClient
    .from('articles')
    .select('slug')
    .eq('slug', slug)
    .single()

  if (existing) {
    slug = `${slug}-${Date.now()}`
  }

  // ── Insert article ───────────────────────────────────────────
  const { data: article, error } = await adminClient
    .from('articles')
    .insert({
      title,
      slug,
      excerpt: description ? description.slice(0, 300) : `Video by ${channelTitle}`,
      content: `## ${title}\n\nVideo by **${channelTitle}**.\n\n${description ?? ''}`,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
      youtube_video_id: videoId,
      topic_id: topicId ?? null,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ article }, { status: 201 })
}

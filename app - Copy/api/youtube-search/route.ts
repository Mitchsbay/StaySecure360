// ============================================================
// /api/youtube-search — Server-side YouTube Data API v3 search
//
// REQUIRED ENVIRONMENT VARIABLES:
//   YOUTUBE_API_KEY  — Google Cloud Console YouTube Data API v3 key
//
// This route is protected by Supabase session auth (admin/editor only).
// The YOUTUBE_API_KEY is NEVER exposed to the client.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export interface YouTubeVideoResult {
  videoId: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
  duration?: string
}

export async function GET(request: NextRequest) {
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

  // ── Parse query params ───────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') ?? '12'), 25)

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'YouTube API key is not configured. Add YOUTUBE_API_KEY to your environment variables.' },
      { status: 500 }
    )
  }

  // ── Call YouTube Data API v3 ─────────────────────────────────
  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', String(maxResults))
    searchUrl.searchParams.set('relevanceLanguage', 'en')
    searchUrl.searchParams.set('safeSearch', 'strict')
    searchUrl.searchParams.set('key', apiKey)

    const searchRes = await fetch(searchUrl.toString())
    if (!searchRes.ok) {
      const errData = await searchRes.json()
      const message = errData?.error?.message ?? 'YouTube API error'
      return NextResponse.json({ error: message }, { status: searchRes.status })
    }

    const searchData = await searchRes.json()
    const items = searchData.items ?? []

    if (items.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Map to clean result objects
    const results: YouTubeVideoResult[] = items.map((item: {
      id: { videoId: string }
      snippet: {
        title: string
        description: string
        thumbnails: { medium?: { url: string }; default?: { url: string } }
        channelTitle: string
        publishedAt: string
      }
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail:
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }))

    return NextResponse.json({ results })
  } catch (err: unknown) {
    console.error('YouTube API error:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch YouTube results'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { buildUrlSet, getTopicSitemapUrls, sitemapHeaders } from '@/lib/seo-sitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
  const urls = await getTopicSitemapUrls()
  return new NextResponse(buildUrlSet(urls), { headers: sitemapHeaders() })
}

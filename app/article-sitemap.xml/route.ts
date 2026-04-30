import { NextResponse } from 'next/server'
import { buildUrlSet, getArticleSitemapUrls, sitemapHeaders } from '@/lib/seo-sitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
  const urls = await getArticleSitemapUrls()
  return new NextResponse(buildUrlSet(urls), { headers: sitemapHeaders() })
}

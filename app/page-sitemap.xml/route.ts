import { NextResponse } from 'next/server'
import { buildUrlSet, getStaticSitemapUrls, sitemapHeaders } from '@/lib/seo-sitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
  return new NextResponse(buildUrlSet(getStaticSitemapUrls()), { headers: sitemapHeaders() })
}

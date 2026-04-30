import { NextResponse } from 'next/server'
import { absoluteSiteUrl, buildSitemapIndex, sitemapHeaders } from '@/lib/seo-sitemap'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  const xml = buildSitemapIndex([
    { loc: absoluteSiteUrl('/page-sitemap.xml'), lastmod: now },
    { loc: absoluteSiteUrl('/article-sitemap.xml'), lastmod: now },
    { loc: absoluteSiteUrl('/topic-sitemap.xml'), lastmod: now },
  ])

  return new NextResponse(xml, { headers: sitemapHeaders() })
}

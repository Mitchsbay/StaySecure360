import { createPublicClient } from '@/lib/supabase/public'
import { getSiteUrl } from '@/lib/utils'

type SitemapUrl = {
  loc: string
  lastmod?: string | Date | null
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

type SitemapEntry = {
  loc: string
  lastmod?: string | Date | null
}

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  // Keep the sitemap fresh without making Google wait on a database call every time.
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
}

export function sitemapHeaders() {
  return XML_HEADERS
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toIsoDate(value?: string | Date | null): string {
  if (!value) return new Date().toISOString()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function normalisePath(path: string): string {
  if (!path || path === '/') return ''
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

export function absoluteSiteUrl(path = ''): string {
  return `${getSiteUrl()}${normalisePath(path)}`
}

export function buildUrlSet(urls: SitemapUrl[]): string {
  const body = urls
    .map((url) => {
      const parts = [
        '  <url>',
        `    <loc>${escapeXml(url.loc)}</loc>`,
        url.lastmod ? `    <lastmod>${toIsoDate(url.lastmod)}</lastmod>` : '',
        url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : '',
        typeof url.priority === 'number' ? `    <priority>${url.priority.toFixed(1)}</priority>` : '',
        '  </url>',
      ].filter(Boolean)

      return parts.join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function buildSitemapIndex(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const parts = [
        '  <sitemap>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        entry.lastmod ? `    <lastmod>${toIsoDate(entry.lastmod)}</lastmod>` : '',
        '  </sitemap>',
      ].filter(Boolean)

      return parts.join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

export function getStaticSitemapUrls(): SitemapUrl[] {
  const now = new Date()
  return [
    { loc: absoluteSiteUrl('/'), lastmod: now, changefreq: 'daily', priority: 1.0 },
    { loc: absoluteSiteUrl('/articles'), lastmod: now, changefreq: 'daily', priority: 0.9 },
    { loc: absoluteSiteUrl('/topics'), lastmod: now, changefreq: 'weekly', priority: 0.8 },
    { loc: absoluteSiteUrl('/videos'), lastmod: now, changefreq: 'weekly', priority: 0.7 },
    { loc: absoluteSiteUrl('/about'), lastmod: now, changefreq: 'monthly', priority: 0.5 },
    { loc: absoluteSiteUrl('/contact'), lastmod: now, changefreq: 'monthly', priority: 0.4 },
  ]
}

export async function getArticleSitemapUrls(): Promise<SitemapUrl[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Article sitemap: Supabase env vars missing.')
    return []
  }

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at, created_at')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .order('published_at', { ascending: false })
      .limit(5000)

    if (error) {
      console.error('Article sitemap query failed:', error)
      return []
    }

    return (data ?? [])
      .filter((article) => article.slug)
      .map((article) => ({
        loc: absoluteSiteUrl(`/articles/${article.slug}`),
        lastmod: article.updated_at ?? article.published_at ?? article.created_at,
        changefreq: 'weekly',
        priority: 0.8,
      }))
  } catch (error) {
    console.error('Article sitemap generation failed:', error)
    return []
  }
}

export async function getTopicSitemapUrls(): Promise<SitemapUrl[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Topic sitemap: Supabase env vars missing.')
    return []
  }

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('topics')
      .select('slug, updated_at, created_at')
      .not('slug', 'is', null)
      .order('sort_order', { ascending: true })
      .limit(1000)

    if (error) {
      console.error('Topic sitemap query failed:', error)
      return []
    }

    return (data ?? [])
      .filter((topic) => topic.slug)
      .map((topic) => ({
        loc: absoluteSiteUrl(`/topics/${topic.slug}`),
        lastmod: topic.updated_at ?? topic.created_at,
        changefreq: 'weekly',
        priority: 0.7,
      }))
  } catch (error) {
    console.error('Topic sitemap generation failed:', error)
    return []
  }
}

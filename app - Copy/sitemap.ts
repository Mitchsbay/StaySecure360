import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function getSafeDate(value?: string | null) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/topics`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/videos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Sitemap: Supabase env vars missing, returning static pages only.')
    return staticPages
  }

  try {
    const { getPublishedArticles, getAllTopics } = await import('@/lib/queries')
    const [articles, topics] = await Promise.all([getPublishedArticles(), getAllTopics()])

    const articlePages: MetadataRoute.Sitemap = articles
      .filter((article) => article.slug)
      .map((article) => ({
        url: `${siteUrl}/articles/${article.slug}`,
        lastModified: getSafeDate(article.updated_at ?? article.published_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      }))

    const topicPages: MetadataRoute.Sitemap = topics
      .filter((topic) => topic.slug)
      .map((topic) => ({
        url: `${siteUrl}/topics/${topic.slug}`,
        lastModified: getSafeDate(topic.updated_at),
        changeFrequency: 'weekly',
        priority: 0.7,
      }))

    return [...staticPages, ...articlePages, ...topicPages]
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    return staticPages
  }
}

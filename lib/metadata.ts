// ============================================================
// StaySecure360 — Metadata Generation Helpers
// Used by Next.js generateMetadata() functions
// ============================================================
import type { Metadata } from 'next'
import { getSiteUrl } from './utils'
import type { Article, Topic } from '@/types'

const SITE_NAME = 'StaySecure360'

// Default description: 120–160 characters for optimal SERP display
const DEFAULT_DESCRIPTION =
  'Free security education for workplaces and individuals — phishing, tailgating, social engineering, and practical guides for staying secure.'

// Default OG image used when no article image is available
const DEFAULT_OG_IMAGE = `${getSiteUrl()}/og-default.png`

/**
 * Truncate a title to fit within the 60-character SEO limit.
 * Cuts at the last word boundary before the limit.
 */
function truncateTitle(title: string, max = 60): string {
  if (title.length <= max) return title
  const cut = title.lastIndexOf(' ', max)
  return cut > 0 ? title.slice(0, cut) + '…' : title.slice(0, max) + '…'
}

export function buildBaseMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  return {
    metadataBase: new URL(siteUrl),
    title: {
      // 37 characters — within 30–60 target
      default: 'StaySecure360 — Security Education',
      template: `%s | StaySecure360`,
    },
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_AU',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@staysecure360',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function buildArticleMetadata(article: Article): Metadata {
  const siteUrl = getSiteUrl()

  // Use meta_title if set, otherwise truncate the article title to 60 chars
  const rawTitle = article.meta_title ?? article.title
  const title = truncateTitle(rawTitle, 60)

  const description = article.meta_description ?? article.excerpt ?? DEFAULT_DESCRIPTION
  const url = `${siteUrl}/articles/${article.slug}`

  // OG image priority: AI-generated image > YouTube thumbnail > default site image
  const ogImageUrl = article.featured_image_url
    ? article.featured_image_url
    : article.youtube_video_id
    ? `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`
    : DEFAULT_OG_IMAGE

  const ogImages = [
    {
      url: ogImageUrl,
      width: 1200,
      height: 630,
      alt: article.title,
    },
  ]

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: SITE_NAME,
      locale: 'en_AU',
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export function buildTopicMetadata(topic: Topic): Metadata {
  const siteUrl = getSiteUrl()

  // Keep topic titles concise: "Physical Security Guides | StaySecure360" = ~42 chars
  const title = truncateTitle(`${topic.name} Security Guides`, 55)
  const description = topic.description
    ? topic.description.slice(0, 160)
    : `Practical security guides on ${topic.name} — tips, checklists, and expert advice for individuals and workplaces.`
  const url = `${siteUrl}/topics/${topic.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_AU',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

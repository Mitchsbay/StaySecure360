// ============================================================
// StaySecure360 — Metadata Generation Helpers
// Used by Next.js generateMetadata() functions
// ============================================================
import type { Metadata } from 'next'
import { getSiteUrl, stripMarkdown } from './utils'
import type { Article, Topic } from '@/types'

const SITE_NAME = 'StaySecure360'
const SITE_LOCALE = 'en_AU'

const DEFAULT_DESCRIPTION =
  'Free security education for workplaces and individuals — phishing, tailgating, social engineering, and practical guides for staying secure.'

// Use an asset that exists in /public so pages never emit a broken OG image.
const DEFAULT_OG_IMAGE_PATH = '/favicon-512x512.png'

export function absoluteUrl(pathOrUrl: string): string {
  const value = pathOrUrl?.trim()
  if (!value) return `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`
  if (/^https?:\/\//i.test(value)) return value
  return `${getSiteUrl()}${value.startsWith('/') ? value : `/${value}`}`
}

function trimToLength(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned

  const cut = cleaned.lastIndexOf(' ', max - 1)
  return `${cleaned.slice(0, cut > 0 ? cut : max - 1).trim()}…`
}

export function cleanSeoTitle(title: string): string {
  return trimToLength(title || SITE_NAME, 60)
}

export function cleanMetaDescription(description: string): string {
  const cleaned = stripMarkdown(description || DEFAULT_DESCRIPTION)
  return trimToLength(cleaned, 160)
}

export function getArticleOgImage(article: Article): string {
  const futureArticle = article as Article & {
    og_image_url?: string | null
  }

  if (futureArticle.og_image_url) return absoluteUrl(futureArticle.og_image_url)
  if (article.featured_image_url) return absoluteUrl(article.featured_image_url)
  if (article.youtube_video_id) {
    return `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`
  }
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH)
}

function getArticleSeoTitle(article: Article): string {
  const futureArticle = article as Article & {
    og_title?: string | null
  }

  return cleanSeoTitle(article.meta_title || futureArticle.og_title || article.title)
}

function getArticleSeoDescription(article: Article): string {
  const futureArticle = article as Article & {
    og_description?: string | null
  }

  return cleanMetaDescription(
    article.meta_description || futureArticle.og_description || article.excerpt || DEFAULT_DESCRIPTION
  )
}

export function buildBaseMetadata(): Metadata {
  const siteUrl = getSiteUrl()
  const defaultImage = absoluteUrl(DEFAULT_OG_IMAGE_PATH)

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: 'StaySecure360 — Security Education',
      template: `%s | StaySecure360`,
    },
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      url: siteUrl,
      images: [{ url: defaultImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@staysecure360',
      images: [defaultImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function buildArticleMetadata(article: Article): Metadata {
  const title = getArticleSeoTitle(article)
  const description = getArticleSeoDescription(article)
  const url = absoluteUrl(`/articles/${article.slug}`)
  const imageUrl = getArticleOgImage(article)

  const futureArticle = article as Article & {
    og_title?: string | null
    og_description?: string | null
    seo_keywords?: string[] | string | null
    image_alt_text?: string | null
  }

  const ogTitle = cleanSeoTitle(futureArticle.og_title || title)
  const ogDescription = cleanMetaDescription(futureArticle.og_description || description)
  const imageAlt = futureArticle.image_alt_text || article.title
  const keywords = Array.isArray(futureArticle.seo_keywords)
    ? futureArticle.seo_keywords
    : typeof futureArticle.seo_keywords === 'string'
    ? futureArticle.seo_keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean)
    : undefined

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url,
      type: 'article',
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      publishedTime: article.published_at ?? article.created_at,
      modifiedTime: article.updated_at,
      section: article.topic?.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [imageUrl],
    },
  }
}

export function buildTopicMetadata(topic: Topic): Metadata {
  const title = cleanSeoTitle(`${topic.name} Security Guides`)
  const description = cleanMetaDescription(
    topic.description ||
      `Practical security guides on ${topic.name} — tips, checklists, and expert advice for individuals and workplaces.`
  )
  const url = absoluteUrl(`/topics/${topic.slug}`)
  const defaultImage = absoluteUrl(DEFAULT_OG_IMAGE_PATH)

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
      locale: SITE_LOCALE,
      images: [{ url: defaultImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [defaultImage],
    },
  }
}

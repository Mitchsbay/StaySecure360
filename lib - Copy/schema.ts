// ============================================================
// StaySecure360 — JSON-LD Schema Helpers
// ============================================================
import { getSiteUrl, stripMarkdown } from './utils'
import { absoluteUrl, getArticleOgImage } from './metadata'
import type { Article, Faq } from '@/types'

const SITE_NAME = 'StaySecure360'
const DEFAULT_LOGO = '/favicon-512x512.png'

function articleDescription(article: Article): string {
  return stripMarkdown(article.meta_description || article.excerpt || article.title)
}

function publisherSchema() {
  const siteUrl = getSiteUrl()

  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(DEFAULT_LOGO),
    },
  }
}

export function articleSchema(article: Article) {
  const url = absoluteUrl(`/articles/${article.slug}`)
  const futureArticle = article as Article & {
    seo_keywords?: string[] | string | null
  }

  const keywords = Array.isArray(futureArticle.seo_keywords)
    ? futureArticle.seo_keywords
    : typeof futureArticle.seo_keywords === 'string'
    ? futureArticle.seo_keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean)
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.meta_title || article.title,
    description: articleDescription(article),
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: [getArticleOgImage(article)],
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at ?? article.published_at ?? article.created_at,
    author: publisherSchema(),
    publisher: publisherSchema(),
    ...(article.topic?.name ? { articleSection: article.topic.name } : {}),
    ...(keywords?.length ? { keywords: keywords.join(', ') } : {}),
  }
}

export function faqSchema(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  }
}

export function videoSchema(article: Article) {
  const youtubeId = article.youtube_video_id!

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: article.title,
    description: articleDescription(article),
    thumbnailUrl: [
      `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    ],
    uploadDate: article.published_at ?? article.updated_at ?? article.created_at,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    url: absoluteUrl(`/articles/${article.slug}`),
    publisher: publisherSchema(),
  }
}

export function organizationSchema() {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: absoluteUrl(DEFAULT_LOGO),
    description:
      'Practical security education covering digital and physical threats for individuals, workplaces, and organisations.',
  }
}

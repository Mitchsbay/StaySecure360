// ============================================================
// StaySecure360 — JSON-LD Schema Helpers
// ============================================================
import { getSiteUrl } from './utils'
import type { Article, Faq } from '@/types'

export function articleSchema(article: Article) {
  const siteUrl = getSiteUrl()

  // Use featured image if available; fall back to YouTube thumbnail for
  // video articles (which have no featured_image_url by design).
  const imageUrl =
    article.featured_image_url ??
    (article.youtube_video_id
      ? `https://img.youtube.com/vi/${article.youtube_video_id}/hqdefault.jpg`
      : null)

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt ?? '',
    url: `${siteUrl}/articles/${article.slug}`,
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at,
    // author — set to the organisation rather than exposing individual names
    author: {
      '@type': 'Organization',
      name: 'StaySecure360',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'StaySecure360',
      url: siteUrl,
    },
    ...(imageUrl && { image: imageUrl }),
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
  const siteUrl = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  }
}

export function videoSchema(
  article: Pick<Article, 'title' | 'excerpt' | 'slug' | 'published_at' | 'updated_at' | 'youtube_video_id'>
) {
  const siteUrl = getSiteUrl()
  const youtubeId = article.youtube_video_id!

  // Google requires: name, description, thumbnailUrl, uploadDate
  // Google recommends: embedUrl, contentUrl, duration, expires
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',

    // Required by Google
    name: article.title,
    description: article.excerpt ?? article.title,
    thumbnailUrl: [
      `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    ],
    uploadDate: article.published_at ?? article.updated_at,

    // Strongly recommended
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${youtubeId}`,

    // Page where the video is embedded
    url: `${siteUrl}/articles/${article.slug}`,

    // Publisher
    publisher: {
      '@type': 'Organization',
      name: 'StaySecure360',
      url: siteUrl,
    },
  }
}

export function organizationSchema() {
  const siteUrl = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StaySecure360',
    url: siteUrl,
    description:
      'Practical security education covering digital and physical threats for individuals, workplaces, and organisations.',
  }
}

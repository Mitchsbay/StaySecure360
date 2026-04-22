import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Tag } from 'lucide-react'
import {
  getArticleBySlug,
  getFaqsByArticle,
  getChecklistByArticle,
  getRelatedArticles,
} from '@/lib/queries'
import { markdownToHtml } from '@/lib/utils'
import { buildArticleMetadata } from '@/lib/metadata'
import { articleSchema, faqSchema, breadcrumbSchema, videoSchema } from '@/lib/schema'
import { formatDate } from '@/lib/utils'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import FaqAccordion from '@/components/ui/FaqAccordion'
import Checklist from '@/components/ui/Checklist'
import VideoEmbed from '@/components/ui/VideoEmbed'
import ArticleCard from '@/components/ui/ArticleCard'
import Image from 'next/image'

// ISR — pages are cached and regenerated in the background every 10 minutes.
// This dramatically reduces the cold-start response time (from ~3s to <200ms)
// while keeping content fresh. The first request after deploy may be slower.
export const revalidate = 600 // 10 minutes

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug)
  if (!article) return {}
  return buildArticleMetadata(article)
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug)
  if (!article) notFound()

  const [faqs, checklistItems, relatedArticles] = await Promise.all([
    getFaqsByArticle(article.id),
    getChecklistByArticle(article.id),
    getRelatedArticles(article.id, article.topic_id),
  ])

  const breadcrumbs = [
    { label: 'Articles', href: '/articles' },
    ...(article.topic ? [{ label: article.topic.name, href: `/topics/${article.topic.slug}` }] : []),
    { label: article.title },
  ]

  const schemas = [
    articleSchema(article),
    ...(faqs.length ? [faqSchema(faqs)] : []),
    // VideoObject schema — only included when the article has a YouTube video.
    // This makes the page eligible for Google's video rich results (video
    // thumbnail shown directly in search results), which increases CTR.
    ...(article.youtube_video_id ? [videoSchema(article)] : []),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Articles', url: '/articles' },
      { name: article.title, url: `/articles/${article.slug}` },
    ]),
  ]

  return (
    <>
      {/* JSON-LD */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <article className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Header */}
          <header className="mb-8">
            {article.topic && (
              <Link
                href={`/topics/${article.topic.slug}`}
                className="badge-blue mb-4 inline-flex items-center gap-1.5"
              >
                <Tag className="w-3 h-3" />
                {article.topic.name}
              </Link>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed mb-4">{article.excerpt}</p>
            )}
            {article.published_at && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Published {formatDate(article.published_at)}
              </div>
            )}
          </header>

          {/* Featured hero image */}
          {article.featured_image_url && !article.youtube_video_id && (
            <div className="mb-8 rounded-xl overflow-hidden relative h-64 md:h-96">
              <Image
                src={article.featured_image_url}
                alt={article.title}
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* YouTube video */}
          {article.youtube_video_id && (
            <div className="mb-8">
              <VideoEmbed videoId={article.youtube_video_id} title={article.title} />
            </div>
          )}

          {/* Article body */}
          {article.content && (
            <div
              className="prose-content mb-10"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(article.content),
              }}
            />
          )}

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <div className="mb-10">
              <Checklist items={checklistItems} />
            </div>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <FaqAccordion faqs={faqs} />
            </div>
          )}

          {/* Topic link */}
          {article.topic && (
            <div className="mb-10 p-5 bg-brand-50 rounded-xl border border-brand-100">
              <p className="text-sm text-brand-700 font-medium mb-1">Filed under</p>
              <Link
                href={`/topics/${article.topic.slug}`}
                className="font-bold text-brand-800 hover:text-brand-600 transition-colors"
              >
                {article.topic.name} &rarr;
              </Link>
              {article.topic.description && (
                <p className="text-sm text-brand-600 mt-1">{article.topic.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <div className="border-t border-gray-200 mt-10 pt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <ArticleCard key={related.id} article={related} />
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </>
  )
}

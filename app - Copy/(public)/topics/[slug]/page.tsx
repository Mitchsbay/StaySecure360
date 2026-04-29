import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTopicBySlug, getChildTopics, getArticlesByTopicTree } from '@/lib/queries'
import { buildTopicMetadata } from '@/lib/metadata'
import { breadcrumbSchema } from '@/lib/schema'
import ArticleCard from '@/components/ui/ArticleCard'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import CtaSection from '@/components/sections/CtaSection'

// Fully dynamic — rendered at request time, not build time.
export const revalidate = 600

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopicBySlug(params.slug)
  if (!topic) return {}
  return buildTopicMetadata(topic)
}

export default async function TopicPage({ params }: Props) {
  const topic = await getTopicBySlug(params.slug)
  if (!topic) notFound()

  const [childTopics, articles] = await Promise.all([
    getChildTopics(topic.id),
    getArticlesByTopicTree(topic.id),
  ])

  const featured = articles.slice(0, 3)
  const supporting = articles.slice(3)
  const isPillarPage = !topic.parent_id && childTopics.length > 0

  const articlesByChildTopic = childTopics.map((child) => ({
    topic: child,
    articles: articles.filter((article) => article.topic_id === child.id).slice(0, 6),
  }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Topics', url: '/topics' },
              { name: topic.name, url: `/topics/${topic.slug}` },
            ])
          ),
        }}
      />

      {/* Header */}
      <section
        className="py-12 border-b border-gray-200"
        style={{ backgroundColor: topic.color ? `${topic.color}10` : '#eff6ff' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Breadcrumbs items={[{ label: 'Topics', href: '/topics' }, { label: topic.name }]} />
          </div>
          <p className="text-sm font-semibold text-brand-600 mb-2">
            {isPillarPage ? 'Pillar Topic' : 'Security Subtopic'}
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{topic.name}</h1>
          {topic.description && (
            <p className="text-lg text-gray-600 max-w-2xl">{topic.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-3">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
            {isPillarPage ? ` across ${childTopics.length} subtopics` : ''}
          </p>
        </div>
      </section>

      {/* Child topic navigation for pillar pages */}
      {isPillarPage && (
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">Explore {topic.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childTopics.map((child) => {
                const count = articles.filter((article) => article.topic_id === child.id).length
                return (
                  <Link
                    key={child.id}
                    href={`/topics/${child.slug}`}
                    className="rounded-xl border border-gray-200 p-4 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    {child.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{child.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      {count} {count === 1 ? 'article' : 'articles'}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured articles */}
      {featured.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isPillarPage ? 'Featured Guides' : 'Featured Articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subtopic clusters shown on parent pillar pages */}
      {isPillarPage && articlesByChildTopic.some((group) => group.articles.length > 0) && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {articlesByChildTopic
              .filter((group) => group.articles.length > 0)
              .map((group) => (
                <div key={group.topic.id}>
                  <div className="flex items-center justify-between mb-5 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">{group.topic.name}</h2>
                    <Link
                      href={`/topics/${group.topic.slug}`}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Supporting articles for child pages, or ungrouped parent articles */}
      {supporting.length > 0 && !isPillarPage && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supporting.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {articles.length === 0 && (
        <section className="py-16 bg-white text-center">
          <p className="text-gray-500 text-lg">No articles in this topic yet. Check back soon.</p>
        </section>
      )}

      <CtaSection />
    </>
  )
}

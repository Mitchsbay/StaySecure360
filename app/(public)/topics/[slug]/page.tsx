import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getTopicBySlug, getArticlesByTopic } from '@/lib/queries'
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

  const articles = await getArticlesByTopic(topic.id)
  const featured = articles.slice(0, 3)
  const supporting = articles.slice(3)

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
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{topic.name}</h1>
          {topic.description && (
            <p className="text-lg text-gray-600 max-w-2xl">{topic.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-3">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </section>

      {/* Featured articles */}
      {featured.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Supporting articles */}
      {supporting.length > 0 && (
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

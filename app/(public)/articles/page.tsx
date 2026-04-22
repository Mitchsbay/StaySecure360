import type { Metadata } from 'next'
import { getPublishedArticles, getAllTopics } from '@/lib/queries'
import ArticleCard from '@/components/ui/ArticleCard'
import CtaSection from '@/components/sections/CtaSection'
import Link from 'next/link'

export const revalidate = 600 // 10 minutes

export const metadata: Metadata = {
  title: 'Security Articles',
  description:
    'Browse all security education articles on StaySecure360 — covering phishing, tailgating, QR scams, social engineering, remote work, and more.',
}

export default async function ArticlesPage() {
  const [articles, topics] = await Promise.all([
    getPublishedArticles(),
    getAllTopics(),
  ])

  return (
    <>
      {/* Page header */}
      <section className="bg-gray-50 border-b border-gray-200 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Security Articles</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            Practical guides covering digital and physical security threats — written for everyone,
            not just IT professionals.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Mobile topic filter — horizontal scroll row, hidden on lg */}
          {topics.length > 0 && (
            <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto">
              <div className="flex gap-2 pb-1 min-w-max">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors whitespace-nowrap"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: topic.color ?? '#3b82f6' }}
                    />
                    {topic.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Articles grid: 1-col mobile → 2-col md */}
            <div className="flex-1 min-w-0">
              {articles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg">No articles published yet. Check back soon.</p>
                </div>
              )}
            </div>

            {/* Desktop sidebar — hidden on mobile (handled by horizontal scroll above) */}
            {topics.length > 0 && (
              <aside className="hidden lg:block lg:w-60 flex-shrink-0">
                <div className="sticky top-24">
                  <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Browse by Topic</h2>
                  <div className="space-y-1">
                    {topics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/topics/${topic.slug}`}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: topic.color ?? '#3b82f6' }}
                        />
                        {topic.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      <CtaSection
        title="Want to go deeper?"
        description="Explore our topic hubs for focused guides on each security area."
        primaryLabel="Browse Topics"
        primaryHref="/topics"
        secondaryLabel="Watch Video Guides"
        secondaryHref="/videos"
      />
    </>
  )
}

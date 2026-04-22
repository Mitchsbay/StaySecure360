import type { Metadata } from 'next'
import { getAllTopics, getPublishedArticles } from '@/lib/queries'
import TopicCard from '@/components/ui/TopicCard'
import CtaSection from '@/components/sections/CtaSection'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Security Topics',
  description:
    'Browse security topics on StaySecure360 — social engineering, physical security, digital threats, remote work, and workplace awareness.',
}

export default async function TopicsPage() {
  const [topics, articles] = await Promise.all([
    getAllTopics(),
    getPublishedArticles(),
  ])

  // Count articles per topic
  const countByTopic: Record<string, number> = {}
  articles.forEach((a) => {
    if (a.topic_id) {
      countByTopic[a.topic_id] = (countByTopic[a.topic_id] ?? 0) + 1
    }
  })

  return (
    <>
      <section className="bg-gray-50 border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Security Topics</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Each topic hub brings together articles, guides, and checklists focused on a specific
            area of digital and physical security.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {topics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  articleCount={countByTopic[topic.id] ?? 0}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Topics coming soon.</p>
          )}
        </div>
      </section>

      <CtaSection />
    </>
  )
}

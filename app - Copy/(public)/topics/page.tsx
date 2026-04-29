import type { Metadata } from 'next'
import { getAllTopics, getPublishedArticles } from '@/lib/queries'
import TopicCard from '@/components/ui/TopicCard'
import CtaSection from '@/components/sections/CtaSection'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Security Topics',
  description:
    'Browse StaySecure360 security topic hubs — physical security, digital threats, social engineering, remote work security, and workplace awareness.',
}

export default async function TopicsPage() {
  const [topics, articles] = await Promise.all([
    getAllTopics(),
    getPublishedArticles(),
  ])

  const parentTopics = topics.filter((topic) => !topic.parent_id)
  const childrenByParent = parentTopics.reduce<Record<string, string[]>>((acc, parent) => {
    acc[parent.id] = topics
      .filter((topic) => topic.parent_id === parent.id)
      .map((topic) => topic.id)
    return acc
  }, {})

  // Count direct and child-topic articles so parent cards behave like pillar hubs.
  const countByTopic: Record<string, number> = {}
  articles.forEach((article) => {
    if (!article.topic_id) return

    countByTopic[article.topic_id] = (countByTopic[article.topic_id] ?? 0) + 1

    const parent = parentTopics.find((topic) => childrenByParent[topic.id]?.includes(article.topic_id!))
    if (parent) {
      countByTopic[parent.id] = (countByTopic[parent.id] ?? 0) + 1
    }
  })

  return (
    <>
      <section className="bg-gray-50 border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Security Topics</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Browse the main StaySecure360 security hubs. Each hub groups related subtopics and articles into a practical security knowledge base.
          </p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {parentTopics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {parentTopics.map((topic) => (
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

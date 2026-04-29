import Link from 'next/link'
import { ArrowRight, Users, Building2, Shield, Laptop, Eye } from 'lucide-react'
import type { Topic } from '@/types'

const iconMap: Record<string, React.ElementType> = {
  Users,
  Building2,
  Shield,
  Laptop,
  Eye,
}

interface TopicCardProps {
  topic: Topic
  articleCount?: number
}

export default function TopicCard({ topic, articleCount }: TopicCardProps) {
  const Icon = (topic.icon && iconMap[topic.icon]) ? iconMap[topic.icon] : Shield

  return (
    <Link
      href={`/topics/${topic.slug}`}
      className="card p-5 sm:p-6 flex flex-col gap-3 sm:gap-4 group cursor-pointer active:scale-[0.99] transition-transform"
    >
      {/* Icon */}
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: topic.color ? `${topic.color}20` : '#eff6ff' }}
      >
        <Icon
          className="w-5 h-5 sm:w-6 sm:h-6"
          style={{ color: topic.color ?? '#3b82f6' }}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-brand-600 transition-colors leading-snug">
          {topic.name}
        </h3>
        {topic.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            {topic.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {articleCount !== undefined && (
          <span className="text-xs text-gray-500">
            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
          </span>
        )}
        <span className="flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:gap-2 transition-all ml-auto">
          Explore <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}

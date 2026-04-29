import Link from 'next/link'
import Image from 'next/image'
import YouTubeThumbnail from '@/components/ui/YouTubeThumbnail'
import { Calendar, ArrowRight } from 'lucide-react'
import { formatDate, truncate } from '@/lib/utils'
import type { Article } from '@/types'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'compact'
  priority?: boolean
}

export default function ArticleCard({ article, variant = 'default', priority = false }: ArticleCardProps) {
  if (variant === 'compact') {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="flex items-start gap-3 group p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2">
            {article.title}
          </h3>
          {article.published_at && (
            <p className="text-xs text-gray-500 mt-1">{formatDate(article.published_at)}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors flex-shrink-0 mt-0.5" aria-hidden="true" />
      </Link>
    )
  }

  const thumbnailUrl = article.youtube_video_id ? 'youtube' : article.featured_image_url ?? null

  return (
    <article className="card overflow-hidden group flex flex-col hover:shadow-lg transition-shadow duration-300">
      {thumbnailUrl && (
        <Link href={`/articles/${article.slug}`} className="block overflow-hidden relative h-48 sm:h-44 flex-shrink-0" aria-label={`Read article: ${article.title}`} tabIndex={-1}>
          {article.youtube_video_id ? (
            <YouTubeThumbnail
              videoId={article.youtube_video_id}
              alt={article.title}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              quality="mq"
            />
          ) : (
            <Image
              src={article.featured_image_url!}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
            />
          )}
        </Link>
      )}

      <div className="p-5 flex flex-col flex-1">
        {article.topic && (
          <Link
            href={`/topics/${article.topic.slug}`}
            className="badge-blue mb-3 inline-block hover:bg-brand-200 transition-colors self-start"
          >
            {article.topic.name}
          </Link>
        )}

        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors leading-snug">
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h2>

        {article.excerpt && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">
            {truncate(article.excerpt, 140)}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          {article.published_at && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(article.published_at)}
            </span>
          )}
          <Link
            href={`/articles/${article.slug}`}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors ml-auto focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 rounded px-2 py-1"
            aria-label={`Read more about ${article.title}`}
          >
            Read more <span className="sr-only">about {article.title}</span> <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

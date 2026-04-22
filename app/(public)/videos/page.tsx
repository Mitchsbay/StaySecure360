import type { Metadata } from 'next'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { getPublishedArticles } from '@/lib/queries'
import { videoSchema } from '@/lib/schema'
import { getSiteUrl } from '@/lib/utils'
import CtaSection from '@/components/sections/CtaSection'
import YouTubeThumbnail from '@/components/ui/YouTubeThumbnail'

export const revalidate = 600 // 10 minutes ISR

export const metadata: Metadata = {
  title: 'Video Guides',
  description:
    'Watch security education video guides on StaySecure360 — covering phishing, social engineering, physical security, and more.',
}

export default async function VideosPage() {
  const allArticles = await getPublishedArticles()
  // Show any published article that has a YouTube video attached
  const videoArticles = allArticles.filter((a) => a.youtube_video_id)

  // ── JSON-LD: ItemList of VideoObject schemas ─────────────────
  // One VideoObject per video article. Google uses this to show video
  // thumbnails directly in search results (video rich results).
  // The ItemList wrapper tells Google this is a curated collection of videos.
  const siteUrl = getSiteUrl()
  const itemListSchema = videoArticles.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Security Education Video Guides — StaySecure360',
        description:
          'A curated collection of security education videos covering phishing, social engineering, physical security, and more.',
        url: `${siteUrl}/videos`,
        numberOfItems: videoArticles.length,
        itemListElement: videoArticles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: videoSchema(article),
        })),
      }
    : null

  return (
    <>
      {/* JSON-LD structured data */}
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      {/* Page header */}
      <section className="bg-gray-50 border-b border-gray-200 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Video Guides</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
            Security education in video format — watch, learn, and share with your team.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {videoArticles.length > 0 ? (
            /* 1-col mobile → 2-col sm → 3-col lg */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
              {videoArticles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="card overflow-hidden group"
                  aria-label={`Watch video: ${article.title}`}
                >
                  {/* YouTube thumbnail with play button overlay */}
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <YouTubeThumbnail
                      videoId={article.youtube_video_id!}
                      alt={`Thumbnail for ${article.title}`}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority={index < 2}
                      quality="hq"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors shadow-lg">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    {article.topic && (
                      <span className="badge-blue mb-2 inline-block">{article.topic.name}</span>
                    )}
                    <h2 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-2 line-clamp-2 text-base sm:text-lg">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2">{article.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-7 h-7 text-gray-500" aria-hidden="true" />
              </div>
              <p className="text-gray-500 text-lg font-medium">Video guides coming soon.</p>
              <p className="text-gray-500 mt-2 text-sm">
                In the meantime, browse our{' '}
                <Link href="/articles" className="text-brand-600 hover:underline">
                  written articles
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      <CtaSection
        title="Prefer reading?"
        description="All our video guides are accompanied by full written articles with checklists and FAQs."
        primaryLabel="Browse Articles"
        primaryHref="/articles"
        secondaryLabel="Explore Topics"
        secondaryHref="/topics"
      />
    </>
  )
}

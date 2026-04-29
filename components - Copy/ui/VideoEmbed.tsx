'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import YouTubeThumbnail from '@/components/ui/YouTubeThumbnail'

interface VideoEmbedProps {
  videoId: string
  title?: string
  className?: string
}

export default function VideoEmbed({ videoId, title = 'YouTube video', className = '' }: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  if (isPlaying) {
    return (
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-lg ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`relative block w-full aspect-video rounded-xl overflow-hidden bg-gray-900 text-left shadow-lg transition-all group ${className}`}
      onClick={() => setIsPlaying(true)}
      aria-label={`Play video: ${title}`}
    >
      <YouTubeThumbnail
        videoId={videoId}
        alt={title}
        priority
        quality="hq"
        sizes="(max-width: 896px) 100vw, 896px"
        className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-700/95 shadow-2xl ring-4 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 sm:h-20 sm:w-20">
          <Play className="ml-1 h-6 w-6 text-white sm:h-8 sm:w-8" fill="currentColor" />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-4">
        <span className="line-clamp-2 text-sm font-medium text-white sm:text-base">{title}</span>
      </span>
    </button>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { getYouTubeThumbnail } from '@/lib/youtube'

interface YouTubeThumbnailProps {
  videoId: string
  alt: string
  priority?: boolean
  sizes: string
  className?: string
  quality?: 'hq' | 'mq'
}

export default function YouTubeThumbnail({
  videoId,
  alt,
  priority = false,
  sizes,
  className = '',
  quality = 'hq',
}: YouTubeThumbnailProps) {
  const sources = useMemo(
    () => [
      getYouTubeThumbnail(videoId, quality),
      getYouTubeThumbnail(videoId, quality === 'hq' ? 'mq' : 'default'),
      getYouTubeThumbnail(videoId, 'default'),
    ],
    [quality, videoId]
  )

  const [sourceIndex, setSourceIndex] = useState(0)

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      sizes={sizes}
      width={480}
      height={360}
      className={`absolute inset-0 h-full w-full ${className}`}
      fetchPriority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        setSourceIndex((current) => (current < sources.length - 1 ? current + 1 : current))
      }}
    />
  )
}

'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
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
    <Image
      src={sources[sourceIndex]}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => {
        setSourceIndex((current) => (current < sources.length - 1 ? current + 1 : current))
      }}
    />
  )
}

export function getYouTubeThumbnail(videoId: string, quality: 'hq' | 'mq' | 'default' = 'hq') {
  switch (quality) {
    case 'mq':
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    case 'default':
      return `https://img.youtube.com/vi/${videoId}/default.jpg`
    case 'hq':
    default:
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }
}

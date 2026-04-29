// ============================================================
// StaySecure360 — Utility Helpers
// ============================================================
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a URL-safe slug from a string
export function generateSlug(text: string): string {
  return text
    // Decode common HTML entities before slugifying so &amp; → and, not amp
    .replace(/&amp;/gi, 'and')
    .replace(/&/g, 'and')
    .replace(/['']/g, '')
    .replace(/["”]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Extract YouTube video ID from various URL formats
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Format a date string for display
export function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Truncate text to a maximum length
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Get the site base URL and normalise it for consistent canonicals/sitemaps.
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.staysecure360.com'
  return raw.replace(/\/$/, '')
}

// Convert markdown-style content to plain text (for excerpts)
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
}

// Convert markdown-style content to HTML for article body display
export function markdownToHtml(text: string): string {
  if (!text) return ''

  return text
    // Convert heading markdown to HTML
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Convert bold markdown to HTML
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert italic markdown to HTML
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Convert list items markdown to HTML
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive list items in <ul> tags
    .replace(/(<li>[\s\S]*?<\/li>(?:\s*<li>[\s\S]*?<\/li>)*)/g, '<ul>$1</ul>')
    // Convert links markdown to HTML
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Convert paragraph breaks to closing and opening tags
    .replace(/\n\n/g, '</p><p>')
    // Add opening <p> tags to lines that don't start with HTML tags
    .replace(/^(?!<[hHuUoOlL])/gm, '<p>')
    // Add closing </p> tags to lines that don't end with HTML tags
    .replace(/([^>])$/gm, '$1</p>')
    // Remove empty paragraph tags
    .replace(/<p><\/p>/g, '')
    // Remove <p> tags that wrap heading tags
    .replace(/<p>(<[hHuUoOlL])/g, '$1')
    // Remove </p> tags that follow closing heading/list tags
    .replace(/(<\/[hHuUoOlL][^>]*>)<\/p>/g, '$1')
    .trim()
}

// ============================================================
// StaySecure360 — Shared TypeScript Types
// ============================================================

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  parent_id: string | null
  sort_order: number | null
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  topic_id: string | null
  status: 'draft' | 'published'
  featured_image_url: string | null
  youtube_url: string | null
  youtube_video_id: string | null
  meta_title: string | null
  meta_description: string | null
  // Optional future SEO/OG fields. These are safe even before DB columns exist.
  og_title?: string | null
  og_description?: string | null
  og_image_url?: string | null
  seo_keywords?: string[] | string | null
  image_alt_text?: string | null
  image_prompt?: string | null
  content_cluster?: string | null
  pillar_topic?: string | null
  internal_link_targets?: InternalLinkTarget[] | string | null
  ai_structure_mode?: string | null
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  topic?: Topic | null
}

export interface Faq {
  id: string
  article_id: string
  question: string
  answer: string
  sort_order: number
  created_at: string
}

export interface ChecklistItem {
  id: string
  article_id: string
  item: string
  sort_order: number
  created_at: string
}

// ============================================================
// API / Form types
// ============================================================

export interface ArticleFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  topic_id: string
  status: 'draft' | 'published'
  featured_image_url: string
  youtube_url: string
  youtube_video_id: string
  meta_title: string
  meta_description: string
}

export interface GenerateArticleRequest {
  prompt: string
  audience?: string
  tone?: string
  topic?: string
  keywords?: string
}

export interface InternalLinkTarget {
  title: string
  slug: string
  anchor: string
  reason?: string
}

export interface GeneratedArticleDraft {
  title: string
  slug: string
  article?: string
  meta_title: string
  meta_description: string
  excerpt: string
  content: string
  image_prompt?: string
  category?: string
  subcategory?: string
  includeChecklist?: boolean
  includeFAQ?: boolean
  key_takeaways: string[]
  checklist_items: string[]
  faq_items: Array<{ question: string; answer: string }>
  suggested_topic: string
  keyword_suggestions: string[]
  content_cluster?: string
  pillar_topic?: string
  internal_links?: InternalLinkTarget[]
  internal_link_targets?: InternalLinkTarget[]
  ai_structure_mode?: string
}


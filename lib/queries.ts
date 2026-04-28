// ============================================================
// StaySecure360 — Supabase Query Helpers
// All public queries return only published content.
// ============================================================
import { createPublicClient } from '@/lib/supabase/public'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Article, Topic, Faq, ChecklistItem, InternalLinkTarget } from '@/types'

// ============================================================
// TOPICS
// ============================================================

export async function getAllTopics(): Promise<Topic[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('getAllTopics error:', error)
    return []
  }
  return data ?? []
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

// ============================================================
// ARTICLES (public — published only)
// ============================================================

export async function getPublishedArticles(limit?: number): Promise<Article[]> {
  const supabase = createPublicClient()
  let query = supabase
    .from('articles')
    .select('*, topic:topics(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) {
    console.error('getPublishedArticles error:', error)
    return []
  }
  return data ?? []
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, topic:topics(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) return null
  return data
}

export async function getArticlesByTopic(topicId: string, limit?: number): Promise<Article[]> {
  const supabase = createPublicClient()
  let query = supabase
    .from('articles')
    .select('*, topic:topics(*)')
    .eq('topic_id', topicId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

function parseInternalLinkTargets(value: Article['internal_link_targets']): InternalLinkTarget[] {
  if (!value) return []

  if (Array.isArray(value)) return value as InternalLinkTarget[]

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

export async function getRelatedArticles(
  articleId: string,
  topicId: string | null,
  limit = 3,
  internalLinkTargets?: Article['internal_link_targets'],
  contentCluster?: string | null
): Promise<Article[]> {
  const supabase = createPublicClient()
  const targetSlugs = parseInternalLinkTargets(internalLinkTargets)
    .map((target) => target.slug)
    .filter(Boolean)
    .slice(0, limit)

  const preferred: Article[] = []

  if (targetSlugs.length > 0) {
    const { data } = await supabase
      .from('articles')
      .select('*, topic:topics(*)')
      .eq('status', 'published')
      .in('slug', targetSlugs)
      .neq('id', articleId)

    if (data) {
      preferred.push(
        ...targetSlugs
          .map((slug) => data.find((article) => article.slug === slug))
          .filter(Boolean) as Article[]
      )
    }
  }

  if (preferred.length >= limit) return preferred.slice(0, limit)

  if (contentCluster) {
    const { data: clusterData } = await supabase
      .from('articles')
      .select('*, topic:topics(*)')
      .eq('status', 'published')
      .eq('content_cluster', contentCluster)
      .neq('id', articleId)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (clusterData) {
      const preferredIds = new Set(preferred.map((article) => article.id))
      const clusterMatches = clusterData.filter((article) => !preferredIds.has(article.id))
      preferred.push(...clusterMatches)
    }
  }

  if (preferred.length >= limit) return preferred.slice(0, limit)

  let query = supabase
    .from('articles')
    .select('*, topic:topics(*)')
    .eq('status', 'published')
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(limit + preferred.length)

  if (topicId) {
    query = query.eq('topic_id', topicId)
  }

  const { data, error } = await query
  if (error) return preferred

  const preferredIds = new Set(preferred.map((article) => article.id))
  const fallback = (data ?? []).filter((article) => !preferredIds.has(article.id))
  return [...preferred, ...fallback].slice(0, limit)
}

// ============================================================
// FAQS
// ============================================================

export async function getFaqsByArticle(articleId: string): Promise<Faq[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('article_id', articleId)
    .order('sort_order', { ascending: true })

  if (error) return []
  return data ?? []
}

// ============================================================
// CHECKLIST ITEMS
// ============================================================

export async function getChecklistByArticle(articleId: string): Promise<ChecklistItem[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('article_id', articleId)
    .order('sort_order', { ascending: true })

  if (error) return []
  return data ?? []
}

// ============================================================
// ARTICLES (admin — all statuses)
// ============================================================

export async function adminGetAllArticles(): Promise<Article[]> {
  // Admin pages must use the authenticated server client so drafts remain visible.
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, topic:topics(*)')
    .order('updated_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function adminGetArticleById(id: string): Promise<Article | null> {
  // Admin edit pages must use the authenticated server client so newly-saved drafts do not 404.
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*, topic:topics(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

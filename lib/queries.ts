// ============================================================
// StaySecure360 — Supabase Query Helpers
// All public queries return only published content.
// ============================================================
import { createPublicClient } from '@/lib/supabase/public'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Article, Topic, Faq, ChecklistItem } from '@/types'

// ============================================================
// TOPICS
// ============================================================

export async function getAllTopics(): Promise<Topic[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('topics')
    .select('*')
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

export async function getRelatedArticles(articleId: string, topicId: string | null, limit = 3): Promise<Article[]> {
  const supabase = createPublicClient()
  let query = supabase
    .from('articles')
    .select('*, topic:topics(*)')
    .eq('status', 'published')
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (topicId) {
    query = query.eq('topic_id', topicId)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
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

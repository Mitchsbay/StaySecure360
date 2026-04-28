'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff, Trash2, ExternalLink, Sparkles, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, extractYouTubeId } from '@/lib/utils'
import type { Article, Topic } from '@/types'

interface ArticleFormProps {
  article?: Article | null
  topics: Topic[]
  mode: 'new' | 'edit'
}

export default function ArticleForm({ article, topics, mode }: ArticleFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // AI generation state
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genSuccess, setGenSuccess] = useState(false)

  // AI featured image state for manual articles
  const [imagePrompt, setImagePrompt] = useState('')

  // AI SEO metadata state for manual articles
  const [generatingSeo, setGeneratingSeo] = useState(false)
  const [seoGenError, setSeoGenError] = useState<string | null>(null)
  const [seoGenSuccess, setSeoGenSuccess] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageGenError, setImageGenError] = useState<string | null>(null)
  const [imageGenSuccess, setImageGenSuccess] = useState(false)

  const [form, setForm] = useState({
    title: article?.title ?? '',
    slug: article?.slug ?? '',
    excerpt: article?.excerpt ?? '',
    content: article?.content ?? '',
    topic_id: article?.topic_id ?? '',
    status: article?.status ?? 'draft',
    featured_image_url: article?.featured_image_url ?? '',
    youtube_url: article?.youtube_url ?? '',
    youtube_video_id: article?.youtube_video_id ?? '',
    meta_title: article?.meta_title ?? '',
    meta_description: article?.meta_description ?? '',
  })

  const parentTopics = topics.filter((topic) => !topic.parent_id)
  const childTopicsByParent = parentTopics.map((parent) => ({
    parent,
    children: topics.filter((topic) => topic.parent_id === parent.id),
  }))
  const ungroupedTopics = topics.filter((topic) =>
    topic.parent_id && !topics.some((parent) => parent.id === topic.parent_id)
  )

  const getTopicLabel = (topic: Topic) => {
    const parent = topics.find((item) => item.id === topic.parent_id)
    return parent ? `${parent.name} — ${topic.name}` : topic.name
  }
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      // Auto-generate slug from title if slug is empty
      if (name === 'title' && mode === 'new' && !prev.slug) {
        updated.slug = generateSlug(value)
      }
      // Auto-extract YouTube video ID
      if (name === 'youtube_url') {
        updated.youtube_video_id = extractYouTubeId(value) ?? ''
      }
      return updated
    })
  }

  // ── Generate article content from video title + description ──
  const handleGenerateFromVideo = async () => {
    if (!form.title) {
      setGenError('The article needs a title before generating content.')
      return
    }

    setGenerating(true)
    setGenError(null)
    setGenSuccess(false)

    // Build a rich prompt from the available video info
    const topicName = topics.find((t) => t.id === form.topic_id)?.name ?? ''
    const prompt = [
      `Write a comprehensive, SEO-optimised article based on the following YouTube video.`,
      `Video title: "${form.title}"`,
      form.excerpt ? `Video description: "${form.excerpt}"` : '',
      topicName ? `Security topic category: ${topicName}` : '',
      `The article should expand on the video's topic with additional context, practical advice, and actionable steps.`,
      `Write for an Australian business audience. Use plain English. Include a checklist of actions and 3–5 FAQs.`,
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          audience: 'Australian business owners and employees',
          tone: 'educational',
          topic: topicName,
          keywords: '',
          generateImage: false, // skip image — video thumbnail already serves as the visual
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }

      const data = await res.json()
      const draft = data.draft

      // Fill in all form fields with the generated content
      setForm((prev) => ({
        ...prev,
        content: draft.content ?? prev.content,
        excerpt: draft.excerpt ?? prev.excerpt,
        meta_title: draft.meta_title ?? prev.meta_title,
        meta_description: draft.meta_description ?? prev.meta_description,
        // Keep title, slug, youtube fields, topic, and image as-is
      }))

      setGenSuccess(true)
      setTimeout(() => setGenSuccess(false), 4000)
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }


  // ── Generate SEO metadata from the current article fields ────
  const handleGenerateSeoMeta = async () => {
    if (!form.title.trim() && !form.excerpt.trim() && !form.content.trim()) {
      setSeoGenError('Add a title, excerpt, or article body before generating SEO metadata.')
      return
    }

    const topicName = topics.find((t) => t.id === form.topic_id)?.name ?? ''

    setGeneratingSeo(true)
    setSeoGenError(null)
    setSeoGenSuccess(false)

    try {
      const res = await fetch('/api/generate-seo-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          topic: topicName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'SEO metadata generation failed')
      }

      setForm((prev) => ({
        ...prev,
        meta_title: data.meta_title ?? prev.meta_title,
        meta_description: data.meta_description ?? prev.meta_description,
      }))
      setSeoGenSuccess(true)
      setTimeout(() => setSeoGenSuccess(false), 4000)
    } catch (err: unknown) {
      setSeoGenError(err instanceof Error ? err.message : 'SEO metadata generation failed')
    } finally {
      setGeneratingSeo(false)
    }
  }

  // ── Generate featured image for manual articles ───────────────
  const handleGenerateFeaturedImage = async () => {
    const topicName = topics.find((t) => t.id === form.topic_id)?.name ?? ''
    const fallbackPrompt = [
      form.title ? `Security article hero image for: ${form.title}` : '',
      form.excerpt ? `Article summary: ${form.excerpt}` : '',
      topicName ? `Security category: ${topicName}` : '',
      'Create a professional, clean, corporate-style illustration suitable for a StaySecure360 article hero image.',
      'Use a modern cyber and workplace security theme. No text, no letters, no logos, no readable screens, and no identifiable faces.',
    ].filter(Boolean).join(' ')

    const finalPrompt = imagePrompt.trim() || fallbackPrompt

    if (!finalPrompt.trim()) {
      setImageGenError('Add a title, excerpt, or custom image prompt first.')
      return
    }

    const slug = form.slug || generateSlug(form.title || 'manual-article')

    setGeneratingImage(true)
    setImageGenError(null)
    setImageGenSuccess(false)

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt: finalPrompt, slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Image generation failed')
      }

      setForm((prev) => ({
        ...prev,
        slug: prev.slug || slug,
        featured_image_url: data.featuredImageUrl ?? prev.featured_image_url,
      }))
      setImageGenSuccess(true)
      setTimeout(() => setImageGenSuccess(false), 4000)
    } catch (err: unknown) {
      setImageGenError(err instanceof Error ? err.message : 'Image generation failed')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const payload = {
      ...form,
      status,
      topic_id: form.topic_id || null,
      youtube_url: form.youtube_url || null,
      youtube_video_id: form.youtube_video_id || null,
      featured_image_url: form.featured_image_url || null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      published_at: status === 'published' ? (article?.published_at ?? new Date().toISOString()) : null,
      ...(mode === 'new' && { created_by: user?.id }),
    }

    let result
    if (mode === 'new') {
      result = await supabase.from('articles').insert(payload).select().single()
    } else {
      result = await supabase
        .from('articles')
        .update(payload)
        .eq('id', article!.id)
        .select()
        .single()
    }

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setSuccess(status === 'published' ? 'Article published!' : 'Draft saved.')
    if (mode === 'new') {
      router.push(`/admin/articles/${result.data.id}`)
    } else {
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!article || !confirm('Delete this article? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('articles').delete().eq('id', article.id)
    router.push('/admin/articles')
  }

  // Show the Generate from Video button when a YouTube video ID is present
  const hasVideo = Boolean(form.youtube_video_id)

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {/* ── AI Generate from Video banner ── */}
      {hasVideo && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-900">Generate Article from Video</p>
              <p className="text-xs text-purple-600 mt-0.5">
                Use AI to write a full article based on this video&apos;s title and description. Your existing content will be replaced.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {genSuccess && (
              <span className="text-xs text-green-600 font-medium">Content generated!</span>
            )}
            {genError && (
              <span className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="w-3.5 h-3.5" /> {genError}
              </span>
            )}
            <button
              type="button"
              onClick={handleGenerateFromVideo}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Article
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 px-4 sm:px-5 py-3 sticky top-4 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`badge ${form.status === 'published' ? 'badge-green' : 'badge-gray'}`}>
            {form.status}
          </span>
          {mode === 'edit' && article?.status === 'published' && (
            <a
              href={`/articles/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-brand-600 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> View live
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60"
          >
            <EyeOff className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Save </span>Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="btn-primary py-2 text-sm disabled:opacity-60"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label htmlFor="field-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              id="field-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 text-lg font-semibold"
              placeholder="Article title"
            />
          </div>

          {/* Slug */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label htmlFor="field-slug" className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">/articles/</span>
              <input
                id="field-slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 font-mono text-sm"
                placeholder="article-slug"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label htmlFor="field-excerpt" className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              id="field-excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 resize-none"
              placeholder="Brief summary shown in article cards and search results"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="field-content" className="block text-sm font-medium text-gray-700">
                Content{' '}
                <span className="text-gray-400 font-normal">(Markdown supported)</span>
              </label>
              {hasVideo && !generating && (
                <button
                  type="button"
                  onClick={handleGenerateFromVideo}
                  disabled={generating}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Generate from video
                </button>
              )}
            </div>
            <textarea
              id="field-content"
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 font-mono text-sm resize-y"
              placeholder="## Introduction&#10;&#10;Write your article content here using Markdown..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Topic */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label htmlFor="field-topic" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select
              id="field-topic"
              name="topic_id"
              value={form.topic_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900"
            >
              <option value="">No topic</option>
              {childTopicsByParent.map(({ parent, children }) => (
                children.length > 0 ? (
                  <optgroup key={parent.id} label={parent.name}>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={parent.id} value={parent.id}>{parent.name}</option>
                )
              ))}
              {ungroupedTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>{getTopicLabel(topic)}</option>
              ))}
            </select>
          </div>

          {/* YouTube */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label htmlFor="field-youtube" className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
            <input
              id="field-youtube"
              name="youtube_url"
              value={form.youtube_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 text-sm"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {form.youtube_video_id && (
              <p className="text-xs text-green-600 mt-1">Video ID: {form.youtube_video_id}</p>
            )}
          </div>

          {/* Featured image */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div>
              <label htmlFor="field-image" className="block text-sm font-medium text-gray-700 mb-1">
                Featured Image URL
              </label>
              <input
                id="field-image"
                name="featured_image_url"
                value={form.featured_image_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 text-sm"
                placeholder="https://..."
              />
            </div>

            {form.featured_image_url && (
              <img
                src={form.featured_image_url}
                alt="Featured image preview"
                className="w-full aspect-video object-cover rounded-lg border border-gray-200"
              />
            )}

            <div>
              <label htmlFor="field-image-prompt" className="block text-xs font-medium text-gray-600 mb-1">
                Optional AI Image Prompt
              </label>
              <textarea
                id="field-image-prompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 text-sm resize-none"
                placeholder="Leave blank to generate from the title, excerpt, and topic."
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateFeaturedImage}
              disabled={generatingImage || !form.title.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              {generatingImage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating image…
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  Generate AI Image
                </>
              )}
            </button>

            {imageGenSuccess && (
              <p className="text-xs text-green-600 font-medium">Image generated and added to this article.</p>
            )}
            {imageGenError && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="w-3.5 h-3.5" /> {imageGenError}
              </p>
            )}
            <p className="text-xs text-gray-500">
              The image is created with OpenAI, uploaded to Supabase Storage, and the URL is saved into this article when you save or publish.
            </p>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">SEO</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Generate a search-friendly meta title and description from the current article content.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateSeoMeta}
                disabled={generatingSeo}
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60 shrink-0"
              >
                {generatingSeo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate SEO Meta
                  </>
                )}
              </button>
            </div>

            {seoGenSuccess && (
              <p className="text-xs text-green-600 font-medium mb-3">SEO metadata generated and added to this article.</p>
            )}
            {seoGenError && (
              <p className="flex items-center gap-1 text-xs text-red-600 mb-3">
                <AlertTriangle className="w-3.5 h-3.5" /> {seoGenError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="field-meta-title" className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                <input
                  id="field-meta-title"
                  name="meta_title"
                  value={form.meta_title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 text-sm ${
                    form.meta_title.length > 60 ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                  }`}
                  placeholder="SEO title (defaults to article title)"
                />
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">Recommended: 50–60 characters</p>
                  <p className={`text-xs ${form.meta_title.length > 60 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                    {form.meta_title.length}/60
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="field-meta-desc" className="block text-xs font-medium text-gray-600 mb-1">
                  Meta Description
                </label>
                <textarea
                  id="field-meta-desc"
                  name="meta_description"
                  value={form.meta_description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-900 text-sm resize-none ${
                    form.meta_description.length > 160 ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                  }`}
                  placeholder="SEO description (defaults to excerpt)"
                />
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">Recommended: 140–155 characters</p>
                  <p className={`text-xs ${form.meta_description.length > 160 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                    {form.meta_description.length}/160
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save actions (bottom) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Publish Article'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

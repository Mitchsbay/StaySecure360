'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Copy, Save, RefreshCw, Image as ImageIcon, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import type { GeneratedArticleDraft, Topic } from '@/types'

const readJsonResponse = async (res: Response) => {
  const text = await res.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { error: text.slice(0, 500) || 'Server returned a non-JSON response' }
  }
}

const getQualityStatusClasses = (status?: string) => {
  switch (status) {
    case 'publish_ready':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'minor_edit':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'rewrite_recommended':
      return 'border-red-200 bg-red-50 text-red-900'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-900'
  }
}

const getQualityBadgeClasses = (status?: string) => {
  switch (status) {
    case 'publish_ready':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'minor_edit':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'rewrite_recommended':
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getQualityBarClasses = (status?: string) => {
  switch (status) {
    case 'publish_ready':
      return 'bg-green-600'
    case 'minor_edit':
      return 'bg-amber-500'
    case 'rewrite_recommended':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getQualityCheckClasses = (status?: string) => {
  switch (status) {
    case 'pass':
      return 'border-green-200 bg-white text-green-800'
    case 'fail':
      return 'border-red-200 bg-white text-red-800'
    default:
      return 'border-amber-200 bg-white text-amber-800'
  }
}


export default function GenerateArticlePage() {
  const router = useRouter()

  // ── Form state ──────────────────────────────────────────────
  const [prompt, setPrompt] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')
  const [topicId, setTopicId] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [keywords, setKeywords] = useState('')
  const [generateImage, setGenerateImage] = useState(true)

  useEffect(() => {
    let active = true

    const loadTopics = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('topics')
        .select('id, name, slug, description, icon, color, parent_id, sort_order, created_at, updated_at')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (active) setTopics((data ?? []) as Topic[])
    }

    loadTopics()

    return () => {
      active = false
    }
  }, [])

  // ── Generation state ─────────────────────────────────────────
  const [generatingText, setGeneratingText] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [draft, setDraft] = useState<GeneratedArticleDraft | null>(null)
  const [imagePromptFromDraft, setImagePromptFromDraft] = useState<string | null>(null)
  const [slugFromDraft, setSlugFromDraft] = useState<string>('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [textError, setTextError] = useState<string | null>(null)

  // ── Save state ───────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const parentTopics = topics.filter((topic) => !topic.parent_id)
  const childTopicsByParent = parentTopics.map((parent) => ({
    parent,
    children: topics.filter((topic) =>
      topic.parent_id === parent.id &&
      topic.id !== parent.id &&
      topic.slug !== parent.slug &&
      topic.name !== parent.name
    ),
  }))
  const orphanedChildTopics = topics.filter((topic) =>
    topic.parent_id && !topics.some((parent) => parent.id === topic.parent_id)
  )
  const selectedTopic = topics.find((item) => item.id === topicId)
  const selectedParentTopic = selectedTopic?.parent_id
    ? topics.find((item) => item.id === selectedTopic.parent_id)
    : null
  const topicGuidance = selectedTopic
    ? selectedParentTopic
      ? selectedParentTopic.name + ' > ' + selectedTopic.name
      : selectedTopic.name
    : ''

  // ── Step 1: Generate article text ───────────────────────────
  // Fast (~5-15s). Returns the draft + an image_prompt for Step 2.
  const handleGenerateText = async () => {
    if (!prompt.trim()) return
    setGeneratingText(true)
    setTextError(null)
    setDraft(null)
    setFeaturedImageUrl(null)
    setImageError(null)
    setImagePromptFromDraft(null)
    setSlugFromDraft('')
    setSaveSuccess(false)
    setSaveError(null)

    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, audience, tone, topic: topicGuidance, topic_id: topicId || null, keywords }),
      })

      if (!res.ok) {
        const data = await readJsonResponse(res)
        throw new Error(data.error ?? 'Text generation failed')
      }

      const data = await readJsonResponse(res)
      const generatedDraft = data.draft as GeneratedArticleDraft & { image_prompt?: string }
      setDraft(generatedDraft)
      setSlugFromDraft(generatedDraft.slug ?? generateSlug(generatedDraft.title))

      // Step 2: kick off image generation automatically if toggled on
      if (generateImage && generatedDraft.image_prompt) {
        setImagePromptFromDraft(generatedDraft.image_prompt)
        // Start image generation immediately after text is done
        generateImageFromPrompt(generatedDraft.image_prompt, generatedDraft.slug ?? generateSlug(generatedDraft.title))
      }
    } catch (err: unknown) {
      setTextError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setGeneratingText(false)
    }
  }

  // ── Step 2: Generate image (separate request) ────────────────
  // Slow (30-60s). Runs independently so text is visible immediately.
  // Can also be called manually as a retry.
  const generateImageFromPrompt = async (imgPrompt: string, slug: string) => {
    setGeneratingImage(true)
    setImageError(null)
    setFeaturedImageUrl(null)

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt: imgPrompt, slug }),
      })

      const data = await readJsonResponse(res)

      if (!res.ok) {
        throw new Error(data.error ?? 'Image generation failed')
      }

      setFeaturedImageUrl(data.featuredImageUrl ?? null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image generation failed'
      setImageError(msg)
    } finally {
      setGeneratingImage(false)
    }
  }

  // ── Retry image generation ───────────────────────────────────
  const handleRetryImage = () => {
    if (imagePromptFromDraft && slugFromDraft) {
      generateImageFromPrompt(imagePromptFromDraft, slugFromDraft)
    }
  }

  // ── Save draft to Supabase ───────────────────────────────────
  const handleSaveDraft = async () => {
    if (!draft) return
    setSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: saveErr } = await supabase
      .from('articles')
      .insert({
        title: draft.title,
        slug: slugFromDraft || generateSlug(draft.title),
        excerpt: draft.excerpt,
        content: draft.content,
        meta_title: draft.meta_title,
        meta_description: draft.meta_description,
        featured_image_url: featuredImageUrl ?? null,
        topic_id: draft.topic_id ?? null,
        image_prompt: draft.image_prompt ?? imagePromptFromDraft ?? null,
        seo_keywords: draft.keyword_suggestions ?? [],
        content_cluster: draft.content_cluster ?? null,
        pillar_topic: draft.pillar_topic ?? null,
        internal_link_targets: draft.internal_link_targets ?? draft.internal_links ?? [],
        ai_structure_mode: draft.ai_structure_mode ?? null,
        status: 'draft',
        created_by: user?.id,
      })
      .select()
      .single()

    setSaving(false)

    if (saveErr) {
      setSaveError(saveErr.message)
      return
    }

    const checklistItems = draft.checklist_items ?? []
    if (checklistItems.length > 0) {
      await supabase.from('checklist_items').insert(
        checklistItems.map((item, index) => ({
          article_id: data.id,
          item,
          sort_order: index,
        }))
      )
    }

    const faqItems = draft.faq_items ?? []
    if (faqItems.length > 0) {
      await supabase.from('faqs').insert(
        faqItems.map((faq, index) => ({
          article_id: data.id,
          question: faq.question,
          answer: faq.answer,
          sort_order: index,
        }))
      )
    }

    setSaveSuccess(true)
    setTimeout(() => router.push(`/admin/articles/${data.id}`), 1500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const isGenerating = generatingText || generatingImage

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          AI Article Generator
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Generate a humanised StaySecure360 article draft using your operator-style writing guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* ── Input panel ── */}
        <div className="space-y-4 sm:space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Article Brief</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic / Prompt *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none text-base"
                  placeholder="e.g. Home security mistakes that make a property an easy target for opportunistic burglars."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Target Audience
                  </label>
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. Office employees"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Default Operator Voice</option>
                    <option value="neutral operator">Neutral Operator</option>
                    <option value="direct and blunt">Direct / Blunt</option>
                    <option value="advisory client-facing">Advisory / Client-Facing</option>
                    <option value="urgent warning without hype">Urgent / Warning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Security Topic / Subcategory
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Auto-select best topic</option>
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
                      <option key={parent.id} value={parent.id}>
                        {parent.name}
                      </option>
                    )
                  ))}
                  {orphanedChildTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Leave on auto and the AI will classify the article from your live topic bank.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Target Keywords
                </label>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. USB drop attack, rogue device, office security"
                />
              </div>

              {/* Image generation toggle */}
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Generate Hero Image</p>
                    <p className="text-xs text-purple-600">DALL-E 3 · ~$0.04 per image</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGenerateImage(!generateImage)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                    generateImage ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                  aria-label={generateImage ? 'Disable image generation' : 'Enable image generation'}
                  aria-pressed={generateImage}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      generateImage ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {textError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {textError}
                </div>
              )}

              <button
                onClick={handleGenerateText}
                disabled={isGenerating || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
              >
                {generatingText ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Writing article…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Article Draft
                  </>
                )}
              </button>

              {/* Progress hints shown while generating */}
              {generatingText && (
                <p className="text-center text-xs text-gray-500 animate-pulse">
                  GPT is writing with the StaySecure360 humanised operator prompt — usually takes 10–20 seconds…
                </p>
              )}
              {generatingImage && (
                <p className="text-center text-xs text-purple-600 animate-pulse">
                  DALL-E 3 is generating your hero image — this can take 30–60 seconds…
                </p>
              )}
            </div>
          </div>

          {/* Review notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800 font-medium mb-1">Review before publishing</p>
            <p className="text-xs text-amber-700">
              AI-generated content must be reviewed and edited before publishing. Always verify
              facts, check accuracy, and ensure the content meets your quality standards.
            </p>
          </div>
        </div>

        {/* ── Output panel ── */}
        <div>
          {draft ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-gray-900">Generated Draft</h2>
                <div className="flex gap-2 items-center">
                  {saveSuccess ? (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Saved! Redirecting…
                    </span>
                  ) : (
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving || generatingText}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? 'Saving…' : 'Save as Draft'}
                    </button>
                  )}
                </div>
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {saveError}
                </div>
              )}

              {draft.quality_score && (
                <div className={`rounded-xl border p-4 ${getQualityStatusClasses(draft.quality_score.status)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-75">Article Quality Score</p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <p className="text-2xl font-bold leading-none">{draft.quality_score.score}/100</p>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getQualityBadgeClasses(draft.quality_score.status)}`}>
                          {draft.quality_score.label}
                        </span>
                      </div>
                    </div>
                    {draft.quality_score.status === 'publish_ready' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-white/70 overflow-hidden border border-white/70">
                    <div
                      className={`h-full rounded-full ${getQualityBarClasses(draft.quality_score.status)}`}
                      style={{ width: `${Math.max(0, Math.min(100, draft.quality_score.score))}%` }}
                    />
                  </div>

                  <p className="mt-3 text-sm opacity-90">{draft.quality_score.recommended_action}</p>

                  {draft.quality_score.checks?.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {draft.quality_score.checks.map((check, index) => (
                        <div key={`${check.label}-${index}`} className={`rounded-lg border px-3 py-2 ${getQualityCheckClasses(check.status)}`}>
                          <p className="text-xs font-semibold">{check.label}</p>
                          <p className="text-xs mt-0.5 opacity-80">{check.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(draft.quality_score.issues?.length > 0 || draft.quality_score.warnings?.length > 0) && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer font-medium">Show validation details</summary>
                      <div className="mt-2 space-y-2">
                        {draft.quality_score.issues?.length > 0 && (
                          <div>
                            <p className="font-semibold">Issues</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {draft.quality_score.issues.map((issue, index) => <li key={`issue-${index}`}>{issue}</li>)}
                            </ul>
                          </div>
                        )}
                        {draft.quality_score.warnings?.length > 0 && (
                          <div>
                            <p className="font-semibold">Warnings</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {draft.quality_score.warnings.map((warning, index) => <li key={`warning-${index}`}>{warning}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* ── Image section ── */}
              {generateImage && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Hero Image
                  </label>

                  {/* Loading state */}
                  {generatingImage && (
                    <div className="w-full aspect-video bg-purple-50 border border-purple-200 rounded-lg flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                      <p className="text-sm text-purple-600 font-medium">Generating with DALL-E 3…</p>
                      <p className="text-xs text-purple-400">This takes 30–60 seconds. Your article is ready to review below.</p>
                    </div>
                  )}

                  {/* Success */}
                  {featuredImageUrl && !generatingImage && (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featuredImageUrl}
                        alt="AI generated hero image"
                        className="w-full rounded-lg border border-gray-200 aspect-video object-cover"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Stored in Supabase Storage · Will be saved with the article
                      </p>
                    </div>
                  )}

                  {/* Error with retry */}
                  {imageError && !generatingImage && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Image generation failed</p>
                          <p className="text-xs text-amber-700 mt-0.5">{imageError}</p>
                          <p className="text-xs text-amber-600 mt-1">
                            Your article draft is ready. You can retry the image or add one manually in the editor.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRetryImage}
                        disabled={generatingImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Image Generation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Image skipped */}
              {!generateImage && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">Image generation was skipped. You can add one in the article editor.</p>
                </div>
              )}

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                  <button onClick={() => copyToClipboard(draft.title)} className="text-xs text-gray-400 hover:text-gray-600 p-1" aria-label="Copy title">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="font-bold text-gray-900 text-base sm:text-lg">{draft.title}</p>
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Slug</label>
                <p className="font-mono text-sm text-gray-600 break-all">{draft.slug}</p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Excerpt</label>
                <p className="text-sm text-gray-700">{draft.excerpt}</p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-1 gap-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Meta Title</label>
                  <p className="text-sm text-gray-700">{draft.meta_title}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Meta Description</label>
                  <p className="text-sm text-gray-700">{draft.meta_description}</p>
                </div>
              </div>

              {/* Auto classification */}
              {(draft.category || draft.subcategory || draft.content_cluster || draft.internal_links?.length) && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
                  <label className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Auto Classification</label>
                  {(draft.category || draft.subcategory) && (
                    <p className="text-sm text-blue-900">
                      {draft.category}{draft.subcategory ? ` → ${draft.subcategory}` : ''}
                    </p>
                  )}
                  {draft.content_cluster && (
                    <p className="text-xs text-blue-700">Cluster: {draft.content_cluster}</p>
                  )}
                  {draft.internal_links?.length ? (
                    <div className="pt-1">
                      <p className="text-xs font-medium text-blue-700 mb-1">Suggested internal links:</p>
                      <ul className="space-y-1">
                        {draft.internal_links.map((link, i) => (
                          <li key={i} className="text-xs text-blue-800">
                            {link.anchor} → /articles/{link.slug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Content preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Content Preview</label>
                  <button onClick={() => copyToClipboard(draft.content)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 p-1" aria-label="Copy content">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                  {draft.content.slice(0, 800)}…
                </pre>
              </div>

              {/* Checklist */}
              {draft.checklist_items?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Checklist Items</label>
                  <ul className="space-y-1">
                    {draft.checklist_items.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQs */}
              {draft.faq_items?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">FAQ Items</label>
                  <div className="space-y-2">
                    {draft.faq_items.map((faq, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                        <p className="text-xs text-gray-600 mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {draft.keyword_suggestions?.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Keyword Suggestions</label>
                  <div className="flex flex-wrap gap-2">
                    {draft.keyword_suggestions.map((kw, i) => (
                      <span key={i} className="badge-blue text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom save button */}
              <button
                onClick={handleSaveDraft}
                disabled={saving || saveSuccess || generatingText}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 text-base"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save as Draft & Edit'}
              </button>

              {generatingImage && (
                <p className="text-center text-xs text-purple-500">
                  Image is still generating — it will be included when you save.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-10 sm:p-12 text-center">
              <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Your generated draft will appear here</p>
              <p className="text-gray-400 text-sm mt-1">
                Fill in the brief on the left and click Generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

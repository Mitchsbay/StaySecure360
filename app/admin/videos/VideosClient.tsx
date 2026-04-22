'use client'

import { useState, useEffect } from 'react'

interface YouTubeResult {
  videoId: string
  title: string
  description: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
}

interface Topic {
  id: string
  name: string
}

export default function VideosClient() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [saving, setSaving] = useState<string | null>(null) // videoId being saved
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load topics for the dropdown
  useEffect(() => {
    fetch('/api/topics')
      .then((r) => r.json())
      .then((data) => setTopics(data.topics ?? []))
      .catch(() => {/* silently ignore */})
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults([])
    setSaveError(null)

    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}&maxResults=12`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Search failed')
        return
      }

      setResults(data.results ?? [])
      if ((data.results ?? []).length === 0) {
        setError('No videos found for that search. Try different keywords.')
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(video: YouTubeResult) {
    setSaving(video.videoId)
    setSaveError(null)

    try {
      const res = await fetch('/api/save-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          channelTitle: video.channelTitle,
          topicId: selectedTopic || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? 'Failed to save video')
        return
      }

      setSaved((prev) => new Set(prev).add(video.videoId))
    } catch {
      setSaveError('Network error — please try again.')
    } finally {
      setSaving(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">YouTube Video Search</h1>
        <p className="text-gray-500 mt-1">
          Search YouTube for security videos and save them to your site as draft articles.
        </p>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. office security tips, phishing awareness, CCTV installation"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {loading ? 'Searching…' : 'Search YouTube'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">Assign topic (optional):</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— No topic —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          Save failed: {saveError}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-gray-500">{results.length} results found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((video) => {
              const isSaved = saved.has(video.videoId)
              const isSaving = saving === video.videoId

              return (
                <div
                  key={video.videoId}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col"
                >
                  {/* Thumbnail */}
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-video bg-gray-900 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-transparent border-l-red-600 ml-1" />
                      </div>
                    </div>
                  </a>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {video.channelTitle} · {formatDate(video.publishedAt)}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-3 flex-1 mb-4">
                      {video.description || 'No description available.'}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => handleSave(video)}
                        disabled={isSaved || isSaving}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isSaved
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : isSaving
                            ? 'bg-brand-100 text-brand-600 cursor-wait'
                            : 'bg-brand-600 text-white hover:bg-brand-700'
                        }`}
                      >
                        {isSaved ? '✓ Saved' : isSaving ? 'Saving…' : 'Save to Site'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {saved.size > 0 && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
              {saved.size} video{saved.size > 1 ? 's' : ''} saved as draft article{saved.size > 1 ? 's' : ''}.
              Go to{' '}
              <a href="/admin/articles" className="underline font-medium">
                Articles
              </a>{' '}
              to review, edit, and publish them.
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-lg font-medium text-gray-500">Search for videos above</p>
          <p className="text-sm mt-1">
            Try keywords like &quot;phishing awareness&quot;, &quot;workplace security&quot;, or &quot;CCTV tips&quot;
          </p>
        </div>
      )}
    </div>
  )
}

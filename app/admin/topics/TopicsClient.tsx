'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import type { Topic } from '@/types'

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', color: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadTopics = useCallback(async () => {
    const { data } = await supabase.from('topics').select('*').order('name')
    setTopics(data ?? [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadTopics() }, [loadTopics])

  const resetForm = () => setForm({ name: '', slug: '', description: '', icon: '', color: '' })

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const payload = { ...form, slug: form.slug || generateSlug(form.name) }

    let result
    if (editingId) {
      result = await supabase.from('topics').update(payload).eq('id', editingId)
    } else {
      result = await supabase.from('topics').insert(payload)
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setEditingId(null)
      setShowNew(false)
      resetForm()
      loadTopics()
    }
    setSaving(false)
  }

  const handleEdit = (topic: Topic) => {
    setEditingId(topic.id)
    setShowNew(false)
    setForm({
      name: topic.name,
      slug: topic.slug,
      description: topic.description ?? '',
      icon: topic.icon ?? '',
      color: topic.color ?? '',
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this topic? Articles in this topic will lose their topic assignment.')) return
    await supabase.from('topics').delete().eq('id', id)
    loadTopics()
  }

  const TopicFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <input
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: editingId ? p.slug : generateSlug(e.target.value) }))}
        placeholder="Topic name *"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        value={form.slug}
        onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
        placeholder="Slug (auto-generated)"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        placeholder="Description"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 md:col-span-2"
      />
      <input
        value={form.icon}
        onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
        placeholder="Icon name (e.g. Shield, Users, Laptop)"
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        type="color"
        value={form.color || '#3b82f6'}
        onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
        className="h-10 w-full border border-gray-300 rounded-lg cursor-pointer"
        title="Topic colour"
      />
      {error && <p className="text-red-600 text-sm md:col-span-2">{error}</p>}
      <div className="flex gap-2 md:col-span-2">
        <button
          onClick={handleSave}
          disabled={saving || !form.name}
          className="btn-primary py-2 text-sm disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? 'Saving...' : 'Save Topic'}
        </button>
        <button
          onClick={() => { setEditingId(null); setShowNew(false); resetForm() }}
          className="btn-ghost py-2 text-sm"
        >
          <X className="w-3.5 h-3.5 mr-1" /> Cancel
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Topics</h1>
          <p className="text-gray-500 mt-1">Manage content categories</p>
        </div>
        {!showNew && (
          <button onClick={() => { setShowNew(true); setEditingId(null); resetForm() }} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> New Topic
          </button>
        )}
      </div>

      {/* New topic form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900">New Topic</h2>
          <TopicFormFields />
        </div>
      )}

      {/* Topics list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {topics.map((topic) => (
              <div key={topic.id}>
                <div className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: topic.color ?? '#3b82f6' }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{topic.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{topic.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(topic)}
                      className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(topic.id)}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {editingId === topic.id && (
                  <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
                    <TopicFormFields />
                  </div>
                )}
              </div>
            ))}
            {topics.length === 0 && (
              <div className="p-8 text-center text-gray-500">No topics yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

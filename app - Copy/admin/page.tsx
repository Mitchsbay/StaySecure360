export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { FileText, Tag, Sparkles, Plus, Eye, Edit } from 'lucide-react'
import { requireAdminRole } from '@/lib/auth'
import { adminGetAllArticles, getAllTopics } from '@/lib/queries'

export default async function AdminDashboard() {
  await requireAdminRole()

  const [articles, topics] = await Promise.all([
    adminGetAllArticles(),
    getAllTopics(),
  ])

  const published = articles.filter((a) => a.status === 'published')
  const drafts = articles.filter((a) => a.status === 'draft')
  const recentArticles = articles.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here is an overview of your content.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Articles', value: articles.length, icon: FileText, color: 'brand' },
          { label: 'Published', value: published.length, icon: Eye, color: 'green' },
          { label: 'Drafts', value: drafts.length, icon: Edit, color: 'yellow' },
          { label: 'Topics', value: topics.length, icon: Tag, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-100`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-3 p-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">New Article</div>
            <div className="text-brand-100 text-sm">Create and publish content</div>
          </div>
        </Link>
        <Link
          href="/admin/generate-article"
          className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
        >
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">AI Generator</div>
            <div className="text-purple-100 text-sm">Generate an article draft</div>
          </div>
        </Link>
        <Link
          href="/admin/topics"
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="font-semibold">Manage Topics</div>
            <div className="text-gray-500 text-sm">Edit categories</div>
          </div>
        </Link>
      </div>

      {/* Recent articles */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Articles</h2>
          <Link href="/admin/articles" className="text-sm text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentArticles.map((article) => (
            <div key={article.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{article.title}</p>
                <p className="text-sm text-gray-500">
                  {article.topic?.name ?? 'No topic'} &middot;{' '}
                  {new Date(article.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`badge ${
                    article.status === 'published' ? 'badge-green' : 'badge-gray'
                  }`}
                >
                  {article.status}
                </span>
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
          {recentArticles.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No articles yet.{' '}
              <Link href="/admin/articles/new" className="text-brand-600 hover:underline">
                Create your first article
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

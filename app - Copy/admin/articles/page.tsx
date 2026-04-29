export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'
import { requireAdminRole } from '@/lib/auth'
import { adminGetAllArticles } from '@/lib/queries'
import { formatDate } from '@/lib/utils'

export default async function AdminArticlesPage() {
  await requireAdminRole()
  const articles = await adminGetAllArticles()

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-500 mt-1 text-sm">{articles.length} total articles</p>
        </div>
        <Link href="/admin/articles/new" className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4 mr-1.5" /> New Article
        </Link>
      </div>

      {/* ── Mobile card list (hidden on md+) ── */}
      <div className="md:hidden space-y-3">
        {articles.map((article) => (
          <div key={article.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
                  {article.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">/{article.slug}</p>
              </div>
              <span
                className={`badge flex-shrink-0 ${
                  article.status === 'published' ? 'badge-green' : 'badge-gray'
                }`}
              >
                {article.status === 'published' ? (
                  <Eye className="w-3 h-3 mr-1" />
                ) : (
                  <EyeOff className="w-3 h-3 mr-1" />
                )}
                {article.status}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {article.topic?.name && (
                  <span className="mr-3 text-gray-600">{article.topic.name}</span>
                )}
                {formatDate(article.updated_at)}
              </div>
              <div className="flex items-center gap-3">
                {article.status === 'published' && (
                  <Link
                    href={`/articles/${article.slug}`}
                    target="_blank"
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  <Edit className="w-3 h-3" /> Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No articles yet.{' '}
            <Link href="/admin/articles/new" className="text-brand-600 hover:underline">
              Create your first article
            </Link>
            .
          </div>
        )}
      </div>

      {/* ── Desktop table (hidden on mobile) ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 max-w-xs truncate">
                      {article.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">/{article.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {article.topic?.name ?? <span className="text-gray-400 italic">None</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${
                        article.status === 'published' ? 'badge-green' : 'badge-gray'
                      }`}
                    >
                      {article.status === 'published' ? (
                        <Eye className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeOff className="w-3 h-3 mr-1" />
                      )}
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(article.updated_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {article.status === 'published' && (
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No articles yet.{' '}
                    <Link href="/admin/articles/new" className="text-brand-600 hover:underline">
                      Create your first article
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

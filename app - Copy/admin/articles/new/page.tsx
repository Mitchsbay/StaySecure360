export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdminRole } from '@/lib/auth'
import { getAllTopics } from '@/lib/queries'
import ArticleForm from '@/components/admin/ArticleForm'

export default async function NewArticlePage() {
  await requireAdminRole()
  const topics = await getAllTopics()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles" className="btn-ghost">
          <ArrowLeft className="w-4 h-4 mr-1" /> Articles
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900">New Article</h1>
      </div>
      <ArticleForm topics={topics} mode="new" />
    </div>
  )
}

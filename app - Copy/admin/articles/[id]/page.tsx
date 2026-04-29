export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdminRole } from '@/lib/auth'
import { adminGetArticleById, getAllTopics } from '@/lib/queries'
import ArticleForm from '@/components/admin/ArticleForm'

interface Props {
  params: { id: string }
}

export default async function EditArticlePage({ params }: Props) {
  await requireAdminRole()

  const [article, topics] = await Promise.all([
    adminGetArticleById(params.id),
    getAllTopics(),
  ])

  if (!article) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/articles" className="btn-ghost">
          <ArrowLeft className="w-4 h-4 mr-1" /> Articles
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{article.title}</h1>
      </div>
      <ArticleForm article={article} topics={topics} mode="edit" />
    </div>
  )
}

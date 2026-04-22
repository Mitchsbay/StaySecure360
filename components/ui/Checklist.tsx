'use client'

import { CheckCircle2 } from 'lucide-react'
import type { ChecklistItem } from '@/types'

interface ChecklistProps {
  items: ChecklistItem[]
  title?: string
}

export default function Checklist({ items, title = 'Checklist' }: ChecklistProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <div className="bg-accent-50 border-2 border-accent-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-accent-900 mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-accent-600" aria-hidden="true" />
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-gray-700 leading-relaxed">{item.item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

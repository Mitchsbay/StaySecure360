import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 text-sm text-gray-600">
      <Link href="/" className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-0.5">
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
          {item.href ? (
            <Link href={item.href} className="px-2 py-1 rounded hover:bg-gray-100 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
              {item.label}
            </Link>
          ) : (
            <span className="px-2 py-1 text-gray-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

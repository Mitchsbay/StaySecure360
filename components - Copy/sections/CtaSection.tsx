import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface CtaSectionProps {
  title?: string
  description?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export default function CtaSection({
  title = 'Start Learning Today',
  description = 'Explore our free security education articles and practical guides. No sign-up required.',
  primaryLabel = 'Browse Articles',
  primaryHref = '/articles',
  secondaryLabel = 'Explore Topics',
  secondaryHref = '/topics',
}: CtaSectionProps) {
  return (
    <section className="bg-brand-600 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
        <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-brand-600 font-semibold rounded-lg hover:bg-brand-50 transition-colors"
          >
            {primaryLabel} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={secondaryHref}
            className="btn-outline-white px-8"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}

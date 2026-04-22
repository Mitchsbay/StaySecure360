'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Faq } from '@/types'

interface FaqAccordionProps {
  faqs: Faq[]
  title?: string
}

export default function FaqAccordion({ faqs, title }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!faqs || faqs.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={faq.id}
          className="border border-gray-200 rounded-lg overflow-hidden hover:border-brand-300 transition-colors bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset"
            aria-expanded={openIndex === index}
            aria-controls={`faq-answer-${index}`}
          >
            <span className="font-semibold text-gray-900 text-base">{faq.question}</span>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-gray-600 flex-shrink-0 transition-transform duration-300',
                openIndex === index && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>

          {openIndex === index && (
            <div
              id={`faq-answer-${index}`}
              className="px-5 py-4 bg-gray-50 border-t border-gray-200 text-gray-700 leading-relaxed"
            >
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

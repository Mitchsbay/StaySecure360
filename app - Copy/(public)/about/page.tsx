import type { Metadata } from 'next'
export const revalidate = 600

import Link from 'next/link'
import { Shield, Target, BookOpen, Users, ArrowRight } from 'lucide-react'
import CtaSection from '@/components/sections/CtaSection'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about StaySecure360 — a free security education platform covering digital and physical threats for individuals, workplaces, and organisations.',
}

const values = [
  {
    icon: Shield,
    title: 'Practical Over Theoretical',
    description:
      'Every article focuses on real-world scenarios and actionable steps — not abstract concepts or vendor marketing.',
  },
  {
    icon: Target,
    title: 'Accessible to Everyone',
    description:
      'Security education should not require a technical background. We write for employees, managers, and everyday individuals.',
  },
  {
    icon: BookOpen,
    title: 'Digital and Physical Together',
    description:
      'Most security education ignores the physical dimension. We cover both — because real attacks cross both boundaries.',
  },
  {
    icon: Users,
    title: 'Free and Open',
    description:
      'All content is free to read, share, and use for training purposes. No paywalls, no sign-ups required.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About StaySecure360</h1>
          <p className="text-xl text-brand-100 leading-relaxed">
            A free security education platform built to bridge the gap between technical security
            knowledge and practical, everyday awareness.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <div className="prose-content">
            <p>
              StaySecure360 was created to address a gap in security education: most resources are
              written for IT and security professionals, not for the people who are most often
              targeted by attacks.
            </p>
            <p>
              The reality is that the majority of successful cyber attacks begin with a human
              element — a phishing email clicked, a door held open for a stranger, a QR code scanned
              without checking. Technical controls can reduce risk, but they cannot eliminate it
              without a security-aware workforce.
            </p>
            <p>
              We cover both digital and physical security because real-world attacks do not respect
              that boundary. A social engineering call can unlock a building. A tailgater can steal
              credentials. A fake courier can plant a device. Understanding how these threats connect
              is essential for anyone who wants to be genuinely secure.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card p-6 flex gap-4">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we cover */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What We Cover</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'Phishing and email-based attacks',
              'Social engineering and manipulation tactics',
              'QR code scams and digital fraud',
              'Tailgating and physical access breaches',
              'Visitor management and access control',
              'Delivery and impersonation fraud',
              'Remote and hybrid work security',
              'Workplace security awareness',
              'Suspicious behaviour recognition',
              'Everyday security habits',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/topics" className="btn-primary">
              Browse all topics <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      <CtaSection
        title="Start Reading"
        description="All content is free. No account required. Start with our most popular articles."
        primaryLabel="Browse Articles"
        primaryHref="/articles"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  )
}

import Link from 'next/link'
import { Shield } from 'lucide-react'

const footerLinks = {
  Learn: [
    { href: '/articles', label: 'All Articles' },
    { href: '/topics', label: 'Browse Topics' },
    { href: '/videos', label: 'Video Guides' },
  ],
  Topics: [
    { href: '/topics/social-engineering', label: 'Social Engineering' },
    { href: '/topics/physical-security', label: 'Physical Security' },
    { href: '/topics/digital-threats', label: 'Digital Threats' },
    { href: '/topics/remote-work-security', label: 'Remote Work' },
    { href: '/topics/workplace-awareness', label: 'Workplace Awareness' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Main grid: 1-col mobile → 2-col sm → 4-col lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand block */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                StaySecure<span className="text-brand-300">360</span>
              </span>
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed max-w-xs">
              Practical security education for individuals, workplaces, and organisations.
              Covering digital and physical threats that affect the real world.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-300 hover:text-white transition-colors"
                      aria-label={heading === 'Topics' ? `Browse security topics about ${link.label}` : link.label}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
          <p className="text-sm text-gray-300">
            &copy; {year} StaySecure360. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 sm:text-right">
            Educational content only. Not legal or professional security advice.
          </p>
        </div>
      </div>
    </footer>
  )
}

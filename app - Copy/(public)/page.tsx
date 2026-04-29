import Link from 'next/link'
import { Shield, ArrowRight, CheckCircle2, Lock, Eye, Users, Building2, Laptop } from 'lucide-react'
import { getPublishedArticles, getAllTopics } from '@/lib/queries'
import ArticleCard from '@/components/ui/ArticleCard'
import TopicCard from '@/components/ui/TopicCard'
import CtaSection from '@/components/sections/CtaSection'
import YouTubeThumbnail from '@/components/ui/YouTubeThumbnail'

export const revalidate = 600 // 10 minutes ISR

const homepageFaqs = [
  {
    q: 'What is StaySecure360?',
    a: 'StaySecure360 is a free security education platform covering both digital and physical security threats. Our articles and guides help individuals, workplaces, and organisations understand and defend against real-world attacks.',
  },
  {
    q: 'Who is this site for?',
    a: 'Anyone who wants to improve their security awareness — employees, managers, remote workers, small business owners, and security-conscious individuals. No technical background required.',
  },
  {
    q: 'Is the content free?',
    a: 'Yes. All articles, guides, and checklists on StaySecure360 are free to read. No account or subscription is required.',
  },
  {
    q: 'How often is new content published?',
    a: 'We publish new articles and guides regularly, covering emerging threats and practical security topics.',
  },
]

const homepageChecklist = [
  'Lock your screen every time you step away from your device',
  'Use a password manager with unique passwords for every account',
  'Enable multi-factor authentication on all important accounts',
  'Be sceptical of unexpected emails, calls, or messages requesting action',
  'Challenge unfamiliar individuals in secure workplace areas',
  'Apply software updates promptly — most attacks exploit known vulnerabilities',
]

export default async function HomePage() {
  const [articles, topics] = await Promise.all([
    getPublishedArticles(6),
    getAllTopics(),
  ])

  const featuredArticles = articles.slice(0, 3)
  const videoArticles = articles.filter((a) => a.youtube_video_id).slice(0, 3)

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-5 sm:mb-6 backdrop-blur-sm">
              <Shield className="w-4 h-4" aria-hidden="true" />
              Practical Security Education
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              Security Awareness for the{' '}
              <span className="text-brand-300">Real World</span>
            </h1>
            <p className="text-base sm:text-xl text-brand-100 leading-relaxed mb-6 sm:mb-8 max-w-2xl">
              Understand how digital and physical threats connect — phishing, tailgating, QR scams,
              social engineering, and more. Free guides for individuals, workplaces, and teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/articles" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 justify-center sm:justify-start">
                Browse Articles <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
              <Link href="/topics" className="btn-outline-white justify-center sm:justify-start">
                Explore Topics
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOPIC HUB ── */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 sm:mb-10">
            <h2 className="section-heading">Security Topics</h2>
            <p className="section-subheading">
              Explore our topic hubs — each covering a key area of digital and physical security.
            </p>
          </div>
          {topics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Topics coming soon.</p>
          )}
        </div>
      </section>

      {/* ── FEATURED ARTICLES ── */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="section-heading">Latest Articles</h2>
              <p className="section-subheading">Practical guides and security education.</p>
            </div>
            <Link href="/articles" className="hidden sm:flex items-center gap-1 text-brand-600 font-medium hover:text-brand-700 transition-colors text-sm" aria-label="View all articles">
              View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          {featuredArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {featuredArticles.map((article, index) => (
                <ArticleCard key={article.id} article={article} priority={index === 0} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Articles coming soon.</p>
          )}
          <div className="mt-6 sm:hidden">
            <Link href="/articles" className="btn-secondary w-full justify-center">
              View all articles
            </Link>
          </div>
        </div>
      </section>

      {/* ── DIGITAL + PHYSICAL CONNECTION ── */}
      <section className="py-12 sm:py-16 bg-brand-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                Digital and Physical Security Are{' '}
                <span className="text-brand-300">Inseparable</span>
              </h2>
              <p className="text-brand-100 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                A phishing email can open a door. A tailgater can steal credentials. A fake courier
                can plant a device. Real-world security threats cross the physical–digital boundary
                constantly — and most defences treat them as separate problems.
              </p>
              <p className="text-brand-100 leading-relaxed mb-6 sm:mb-8">
                StaySecure360 covers both sides of the equation, helping you understand how attacks
                actually work and what practical steps make a real difference.
              </p>
              <Link href="/articles/why-physical-security-breaches-become-cyber-incidents" className="btn-primary bg-brand-500 hover:bg-brand-400 inline-flex">
                Read: Physical Breaches Become Cyber Incidents <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Lock, label: 'Phishing & Credential Theft', desc: 'Email attacks that bypass technical controls through human error' },
                { icon: Building2, label: 'Tailgating & Access Fraud', desc: 'Physical entry exploits that lead to digital compromise' },
                { icon: Eye, label: 'Social Engineering', desc: 'Manipulation tactics that target trust and authority' },
                { icon: Laptop, label: 'Remote Work Risks', desc: 'Home and hybrid working vulnerabilities' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-brand-800/50 rounded-xl p-4 sm:p-5 border border-brand-700">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-300 mb-2 sm:mb-3" aria-hidden="true" />
                  <h3 className="font-semibold text-white text-xs sm:text-sm mb-1">{label}</h3>
                  <p className="text-brand-300 text-xs leading-relaxed hidden sm:block">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO GUIDES ── */}
      {videoArticles.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <h2 className="section-heading">Video Guides</h2>
                <p className="section-subheading">Watch and learn — security education in video format.</p>
              </div>
            <Link href="/videos" className="hidden sm:flex items-center gap-1 text-brand-600 font-medium hover:text-brand-700 transition-colors text-sm" aria-label="View all video guides">
              View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {videoArticles.map((article) => (
                <Link key={article.id} href={`/articles/${article.slug}`} className="card overflow-hidden group" aria-label={`Watch: ${article.title}`}>
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <YouTubeThumbnail
                      videoId={article.youtube_video_id!}
                      alt={article.title}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      quality="mq"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                        <div className="w-0 h-0 border-t-[7px] border-b-[7px] border-l-[12px] border-transparent border-l-brand-600 ml-1" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2 text-sm sm:text-base">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 sm:hidden">
              <Link href="/videos" className="btn-secondary w-full justify-center">
                View all videos
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CHECKLIST ── */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="section-heading">Your Quick Security Checklist</h2>
            <p className="section-subheading mx-auto">
              Six habits that make a measurable difference. Start today.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <ul className="space-y-3 sm:space-y-4">
              {homepageChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-gray-700 leading-relaxed text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
              <Link href="/articles/everyday-security-habits-that-actually-matter" className="btn-primary w-full sm:w-auto justify-center sm:justify-start">
                Read the full guide <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ PREVIEW ── */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="section-heading">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {homepageFaqs.map((faq, i) => (
              <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-colors list-none text-sm sm:text-base">
                  {faq.q}
                  <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" aria-hidden="true">▾</span>
                </summary>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-3 sm:pt-4 text-sm sm:text-base">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / TRUST STATS ── */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                About StaySecure360
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-sm sm:text-base">
                StaySecure360 was created to bridge the gap between technical security knowledge and
                everyday awareness. Most security breaches involve human behaviour — and most people
                never receive practical, accessible guidance on how to protect themselves.
              </p>
              <p className="text-gray-600 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">
                Our content is written for real people in real workplaces — not for IT professionals.
                Every article is designed to be read, understood, and acted on.
              </p>
              <Link href="/about" className="btn-secondary inline-flex" aria-label="Learn more about StaySecure360">
                Learn more about us <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { stat: '100%', label: 'Free to access', sub: 'No account required' },
                { stat: 'AU', label: 'Australian focus', sub: 'Relevant local context' },
                { stat: '360°', label: 'Full coverage', sub: 'Digital and physical' },
                { stat: '∞', label: 'Always growing', sub: 'New content regularly' },
              ].map(({ stat, label, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 text-center shadow-sm">
                  <div className="text-2xl sm:text-3xl font-bold text-brand-600 mb-1">{stat}</div>
                  <div className="font-semibold text-gray-900 text-xs sm:text-sm">{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        title="Ready to improve your security awareness?"
        description="Browse our free articles, explore topic hubs, and download practical checklists — no account required."
        primaryLabel="Start Reading"
        primaryHref="/articles"
        secondaryLabel="Explore Topics"
        secondaryHref="/topics"
      />
    </>
  )
}

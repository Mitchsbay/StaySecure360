import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

type ProductRecord = {
  slug?: string | null;
  price?: number | string | null;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
};

async function getLandingPage(slug: string) {
  const { data: page, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !page) {
    return null;
  }

  return page;
}

async function getRelatedProduct(productId: string) {
  if (!productId) return null;

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .in('status', ['published', 'coming_soon', 'draft'])
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPage(slug);

  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'This page could not be found.',
    };
  }

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || page.intro,
  };
}

type Props = {
  params: Promise<{ slug: string }>;
};

function getSafeText(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function getCtaLabel(pageLabel: string | null | undefined, product: ProductRecord | null) {
  if (pageLabel && pageLabel.trim()) return pageLabel;

  if (product?.price) {
    const numericPrice = Number(product.price);
    if (!Number.isNaN(numericPrice)) {
      return `Get the Ebook for $${numericPrice.toFixed(2)}`;
    }
  }

  return 'Get the Ebook';
}

function isExternalUrl(url: string | null | undefined) {
  return !!url && /^https?:\/\//i.test(url);
}

function normalizeInternalUrl(url: string | null | undefined) {
  if (!url) return '';
  if (isExternalUrl(url)) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function CtaButton({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  const external = isExternalUrl(href);

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`inline-flex items-center justify-center rounded-xl bg-primary-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-primary-950/30 transition hover:bg-primary-500 hover:text-white ${className}`}
    >
      {label}
    </a>
  );
}

export default async function LandingPage({ params }: Props) {
  const { slug } = await params;
  const page = await getLandingPage(slug);

  if (!page) {
    return (
      <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-gray-400 mb-8">
            The page you are looking for does not exist.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const relatedProduct = page.product_id ? await getRelatedProduct(page.product_id) : null;
  const heroImageUrl = page.hero_image_url || relatedProduct?.cover_image_url || null;
  const heroImageAlt = page.hero_image_alt || relatedProduct?.cover_image_alt || page.hero_title || page.title;
  const productPrice = relatedProduct?.price ? Number(relatedProduct.price) : null;
  const ctaHref = normalizeInternalUrl(page.cta_url || (relatedProduct?.slug ? `/products/${relatedProduct.slug}` : ''));
  const ctaLabel = getCtaLabel(page.cta_label, relatedProduct);
  const heroTitle = getSafeText(page.hero_title, page.title);
  const heroSubtitle = getSafeText(
    page.hero_subtitle,
    'A calm, practical roadmap for strengthening your home, routines, and readiness — without fear, overwhelm, or unnecessary spending.'
  );

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_32%)]" />
        <div className="mx-auto max-w-6xl">
          <div className={`grid grid-cols-1 items-center gap-10 ${heroImageUrl ? 'lg:grid-cols-[1.05fr_0.95fr]' : ''}`}>
            <div className={heroImageUrl ? '' : 'max-w-4xl'}>
              {relatedProduct?.category && (
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.26em] text-primary-300">
                  {relatedProduct.category}
                </p>
              )}

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.02]">
                {heroTitle}
              </h1>

              {heroSubtitle && (
                <p className="mt-6 max-w-2xl text-lg leading-8 text-dark-200 sm:text-xl">
                  {heroSubtitle}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                {ctaHref && <CtaButton href={ctaHref} label={ctaLabel} />}
                {productPrice !== null && !Number.isNaN(productPrice) && (
                  <p className="text-sm text-dark-300">
                    Instant digital guide • AUD ${productPrice.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {heroImageUrl && (
              <div className="mx-auto w-full max-w-md lg:ml-auto">
                <div className="relative rounded-3xl border border-primary-400/20 bg-dark-900/70 p-4 shadow-2xl shadow-primary-950/40">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-dark-800">
                    <Image
                      src={heroImageUrl}
                      alt={heroImageAlt}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Intro Section */}
      {page.intro && (
        <section className="border-y border-dark-800 bg-dark-900/45 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className="max-w-4xl text-base leading-8 text-dark-200 sm:text-lg [&_p]:mb-4 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: page.intro }}
            />
          </div>
        </section>
      )}

      {/* Benefits Section */}
      {page.benefits && page.benefits.length > 0 && (
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary-300">What you get</p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Key Benefits</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {page.benefits.map((benefit: string, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-dark-700/80 bg-dark-900/85 p-6 shadow-lg shadow-dark-950/20"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">✓</span>
                    <p className="leading-7 text-dark-200">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      {page.sections && page.sections.length > 0 && (
        <section className="bg-dark-900/45 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {page.sections.map(
                (section: { title: string; items: string[] }, index: number) => (
                  <div key={index} className="rounded-2xl border border-dark-800 bg-dark-950/50 p-7">
                    <h3 className="mb-5 text-2xl font-bold text-white">{section.title}</h3>
                    <ul className="space-y-4">
                      {section.items.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-start gap-3 text-dark-200">
                          <span className="mt-1 text-primary-300">→</span>
                          <span className="leading-7">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      {page.faqs && page.faqs.length > 0 && (
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary-300">Questions</p>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {page.faqs.map(
                (faq: { question: string; answer: string }, index: number) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-dark-700/80 bg-dark-900/85 p-6"
                  >
                    <h4 className="mb-3 text-lg font-semibold text-primary-300">
                      {faq.question}
                    </h4>
                    <p className="leading-7 text-dark-300">{faq.answer}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      {ctaHref && (
        <section className="border-y border-primary-500/30 bg-gradient-to-r from-primary-600/20 to-primary-700/20 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to get started?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-dark-200">
              Start with a clear 30-day plan and build a home security routine you can actually maintain.
            </p>
            <CtaButton href={ctaHref} label={ctaLabel} className="mt-8" />
          </div>
        </section>
      )}
    </div>
  );
}

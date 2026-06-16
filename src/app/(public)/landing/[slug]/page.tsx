import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

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
    .in('status', ['published', 'coming_soon'])
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

async function getRelatedCategory(categoryId: string) {
  if (!categoryId) return null;

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .eq('status', 'published')
    .single();

  if (error || !category) {
    return null;
  }

  return category;
}

async function getRelatedArticles(slug: string, limit: number = 3) {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return articles || [];
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
  const relatedCategory = page.category_id ? await getRelatedCategory(page.category_id) : null;
  const relatedArticles = await getRelatedArticles(slug);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
        {/* Hero Section */}
        <section className="relative py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Hero Content */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  {page.hero_title}
                </h1>

                {page.hero_subtitle && (
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    {page.hero_subtitle}
                  </p>
                )}

                {/* CTA Button */}
                {page.cta_url && page.cta_label && (
                  <a
                    href={page.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg"
                  >
                    {page.cta_label}
                  </a>
                )}
              </div>

              {/* Hero Image */}
              {page.hero_image_url && (
                <div className="relative w-full h-96 bg-dark-800 rounded-xl overflow-hidden">
                  <Image
                    src={page.hero_image_url}
                    alt={page.hero_title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Intro Section */}
        {page.intro && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
            <div className="max-w-4xl mx-auto">
              <div
                className="text-lg text-gray-300 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: page.intro }}
              />
            </div>
          </section>
        )}

        {/* Benefits Section */}
        {page.benefits && page.benefits.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-10">Key Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {page.benefits.map((benefit: string, index: number) => (
                  <div
                    key={index}
                    className="bg-dark-900 border border-dark-800 rounded-xl p-6 flex items-start gap-4"
                  >
                    <span className="text-primary-400 text-2xl flex-shrink-0">✓</span>
                    <p className="text-gray-300">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sections with Checklists */}
        {page.sections && page.sections.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
            <div className="max-w-4xl mx-auto">
              {page.sections.map(
                (section: { title: string; items: string[] }, index: number) => (
                  <div key={index} className="mb-12 last:mb-0">
                    <h3 className="text-2xl font-bold mb-6">{section.title}</h3>
                    <ul className="space-y-3">
                      {section.items.map((item: string, itemIndex: number) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <span className="text-primary-400 flex-shrink-0">→</span>
                          <span className="text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* FAQs Section */}
        {page.faqs && page.faqs.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-10">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {page.faqs.map(
                  (faq: { question: string; answer: string }, index: number) => (
                    <div
                      key={index}
                      className="bg-dark-900 border border-dark-800 rounded-xl p-6"
                    >
                      <h4 className="font-semibold text-lg text-primary-400 mb-3">
                        {faq.question}
                      </h4>
                      <p className="text-gray-400">{faq.answer}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Related Product Section */}
        {relatedProduct && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-dark-900/50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Featured Product</h2>
              <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                  {relatedProduct.cover_image_url && (
                    <div className="relative w-full h-64 bg-dark-800 rounded-lg overflow-hidden">
                      <Image
                        src={relatedProduct.cover_image_url}
                        alt={relatedProduct.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col justify-center">
                    <h3 className="text-2xl font-bold mb-3">{relatedProduct.title}</h3>

                    {relatedProduct.description && (
                      <p className="text-gray-300 mb-6">{relatedProduct.description}</p>
                    )}

                    {relatedProduct.price && (
                      <div className="mb-6">
                        <p className="text-gray-500 text-sm mb-2">Starting at</p>
                        <p className="text-3xl font-bold text-primary-400">
                          ${relatedProduct.price}
                        </p>
                      </div>
                    )}

                    <Link
                      href={`/products/${relatedProduct.slug}`}
                      className="inline-block w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-10">Related Reading</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.slug}`}>
                    <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-500 transition-colors h-full flex flex-col group">
                      {article.featured_image_url && (
                        <div className="relative w-full h-48 bg-dark-800">
                          <Image
                            src={article.featured_image_url}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className="p-6 flex-1 flex flex-col">
                        <h4 className="font-semibold text-lg mb-2 group-hover:text-primary-400 transition-colors">
                          {article.title}
                        </h4>

                        {article.excerpt && (
                          <p className="text-gray-400 text-sm flex-1 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="mt-4 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA Section */}
        {page.cta_url && page.cta_label && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600/20 to-primary-700/20 border-y border-primary-500/30">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
              <a
                href={page.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg"
              >
                {page.cta_label}
              </a>
            </div>
          </section>
        )}
      </div>
  );
}

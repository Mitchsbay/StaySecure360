import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

async function getArticle(slug: string) {
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !article) {
    return null;
  }

  return article;
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

async function getRelatedLandingPage(landingPageId: string) {
  if (!landingPageId) return null;

  const { data: page, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('id', landingPageId)
    .eq('status', 'published')
    .single();

  if (error || !page) {
    return null;
  }

  return page;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'This article could not be found.',
    };
  }

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
  };
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-gray-400 mb-8">
            The article you are looking for does not exist.
          </p>
          <Link
            href="/articles"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const relatedProduct = article.product_id
    ? await getRelatedProduct(article.product_id)
    : null;
  const relatedLandingPage = article.landing_page_id
    ? await getRelatedLandingPage(article.landing_page_id)
    : null;

  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href="/articles"
            className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-8 transition-colors"
          >
            <span className="mr-2">←</span> Back to Articles
          </Link>

          {/* Article Header */}
          <article>
            {/* Featured Image */}
            {article.featured_image_url && (
              <div className="relative w-full h-96 bg-dark-800 rounded-xl overflow-hidden mb-8">
                <Image
                  src={article.featured_image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{article.title}</h1>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-dark-800 text-sm text-gray-400">
              {article.created_at && (
                <div>
                  <span className="text-gray-500">Published</span>
                  <br />
                  {new Date(article.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Content */}
            {article.content && (
              <div className="prose prose-invert max-w-none mb-12">
                <div
                  className="text-gray-300 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            )}
          </article>

          {/* Related Product CTA Card */}
          {relatedProduct && (
            <div className="mb-12 bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-500/30 rounded-xl p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {relatedProduct.title}
                  </h3>
                  {relatedProduct.description && (
                    <p className="text-gray-300">{relatedProduct.description}</p>
                  )}
                </div>
                <Link
                  href={`/products/${relatedProduct.slug}`}
                  className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors whitespace-nowrap"
                >
                  Learn More
                </Link>
              </div>
            </div>
          )}

          {/* Related Landing Page CTA Card */}
          {relatedLandingPage && (
            <div className="mb-12 bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-500/30 rounded-xl p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {relatedLandingPage.title}
                  </h3>
                  {relatedLandingPage.intro && (
                    <p className="text-gray-300">{relatedLandingPage.intro}</p>
                  )}
                </div>
                <Link
                  href={`/landing/${relatedLandingPage.slug}`}
                  className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors whitespace-nowrap"
                >
                  Explore Guide
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

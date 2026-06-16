import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

async function getProduct(slug: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    return null;
  }

  return product;
}

async function getRelatedArticles(productId: string) {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'published')
    .limit(3);

  if (error) {
    return [];
  }

  return articles || [];
}

async function getRelatedLandingPages(productId: string) {
  const { data: landingPages, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('product_id', productId)
    .eq('status', 'published')
    .limit(3);

  if (error) {
    return [];
  }

  return landingPages || [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'This product could not be found.',
    };
  }

  return {
    title: product.seo_title || product.title,
    description: product.seo_description || product.description,
  };
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-400 mb-8">
            The product you are looking for does not exist.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const articles = await getRelatedArticles(product.id);
  const landingPages = await getRelatedLandingPages(product.id);

  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
          <Link
            href="/products"
            className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-8 transition-colors"
          >
            <span className="mr-2">←</span> Back to Products
          </Link>

          {/* Product Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Product Image */}
            {product.cover_image_url && (
              <div className="relative w-full h-96 bg-dark-800 rounded-xl overflow-hidden">
                <Image
                  src={product.cover_image_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Product Details */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">{product.title}</h1>

              {product.description && (
                <p className="text-lg text-gray-300 mb-6">{product.description}</p>
              )}

              {/* Price */}
              {product.price && (
                <div className="mb-8">
                  <p className="text-gray-400 text-sm mb-2">Price</p>
                  <div className="text-3xl font-bold text-primary-400">
                    ${product.price}
                    {product.currency && (
                      <span className="text-lg text-gray-500 ml-2">{product.currency}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="mb-8">
                <span
                  className={`inline-block text-sm px-4 py-2 rounded-full font-semibold ${
                    product.status === 'published'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-amber-900 text-amber-200'
                  }`}
                >
                  {product.status === 'published' ? 'Available Now' : 'Coming Soon'}
                </span>
              </div>

              {/* CTA Button */}
              <div className="mb-8">
                {product.checkout_url ? (
                  <a
                    href={product.checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-center"
                  >
                    Get Now
                  </a>
                ) : product.status === 'coming_soon' ? (
                  <button
                    disabled
                    className="inline-block w-full sm:w-auto bg-gray-700 text-gray-400 font-semibold py-3 px-8 rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <button
                    disabled
                    className="inline-block w-full sm:w-auto bg-gray-700 text-gray-400 font-semibold py-3 px-8 rounded-lg cursor-not-allowed"
                  >
                    Checkout Link Coming Soon
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Included Items */}
          {product.included_items && product.included_items.length > 0 && (
            <div className="mb-12 bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">What's Included</h2>
              <ul className="space-y-3">
                {product.included_items.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-400 mr-3 flex-shrink-0">✓</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="mb-12 bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Benefits</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-400 mr-3 flex-shrink-0">•</span>
                    <span className="text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQs */}
          {product.faqs && product.faqs.length > 0 && (
            <div className="mb-12 bg-dark-900 border border-dark-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {product.faqs.map(
                  (faq: { question: string; answer: string }, index: number) => (
                    <div key={index} className="border-b border-dark-800 pb-4 last:border-b-0">
                      <h3 className="font-semibold text-lg mb-2 text-primary-400">
                        {faq.question}
                      </h3>
                      <p className="text-gray-400">{faq.answer}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {articles.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.slug}`}>
                    <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-500 transition-colors h-full flex flex-col p-6">
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary-400 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-400 text-sm flex-1">{article.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Landing Pages */}
          {landingPages.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Related Guides</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {landingPages.map((page) => (
                  <Link key={page.id} href={`/landing/${page.slug}`}>
                    <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-500 transition-colors h-full flex flex-col p-6">
                      <h3 className="font-semibold text-lg mb-2 hover:text-primary-400 transition-colors">
                        {page.title}
                      </h3>
                      {page.intro && (
                        <p className="text-gray-400 text-sm flex-1">{page.intro}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

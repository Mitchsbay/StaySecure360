import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

async function getCategory(slug: string) {
  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !category) {
    return null;
  }

  return category;
}

async function getRelatedProducts(categoryId: string) {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .in('status', ['published', 'coming_soon'])
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return products || [];
}

async function getRelatedArticles(categoryId: string) {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category_id', categoryId)
    .eq('status', 'published')
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
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'This category could not be found.',
    };
  }

  return {
    title: category.seo_title || category.name,
    description: category.seo_description || category.description,
  };
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return (
      <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <p className="text-gray-400 mb-8">
            The category you are looking for does not exist.
          </p>
          <Link
            href="/categories"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  const products = await getRelatedProducts(category.id);
  const articles = await getRelatedArticles(category.id);

  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
          <Link
            href="/categories"
            className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-8 transition-colors"
          >
            <span className="mr-2">←</span> Back to Categories
          </Link>

          {/* Category Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-lg text-gray-300 mb-6">{category.description}</p>
            )}
          </div>

          {/* Related Products */}
          {products.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Products in this Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group"
                  >
                    <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-500 transition-colors h-full flex flex-col">
                      {/* Product Image */}
                      {product.cover_image_url && (
                        <div className="relative w-full h-48 bg-dark-800">
                          <Image
                            src={product.cover_image_url}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                          {product.title}
                        </h3>

                        {product.description && (
                          <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        {/* Price and Status */}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-dark-800">
                          {product.price && (
                            <div className="text-primary-400 font-semibold">
                              ${product.price}
                            </div>
                          )}
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${
                              product.status === 'published'
                                ? 'bg-green-900 text-green-200'
                                : 'bg-amber-900 text-amber-200'
                            }`}
                          >
                            {product.status === 'published' ? 'Available' : 'Coming Soon'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {articles.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.slug}`}>
                    <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-500 transition-colors h-full flex flex-col p-6">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-400 text-sm flex-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="mt-4 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Content Message */}
          {products.length === 0 && articles.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                No products or articles in this category yet.
              </p>
            </div>
          )}
        </div>
      </div>
  );
}

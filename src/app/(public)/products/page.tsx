import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Products | Stay Secure 360',
  description: 'Browse our comprehensive cybersecurity products and solutions.',
};

async function getProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('status', ['published', 'coming_soon'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products || [];
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Our Products</h1>
            <p className="text-lg text-gray-300">
              Comprehensive cybersecurity solutions to protect what matters most.
            </p>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
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
                            {product.currency && (
                              <span className="text-xs text-gray-500 ml-1">
                                {product.currency}
                              </span>
                            )}
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
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No products available at this time.</p>
            </div>
          )}
        </div>
      </div>
  );
}

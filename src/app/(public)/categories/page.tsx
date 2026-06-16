import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';

export const metadata = {
  title: 'Categories | Stay Secure 360',
  description: 'Explore our cybersecurity solution categories.',
};

async function getCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories || [];
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Solution Categories</h1>
            <p className="text-lg text-gray-300">
              Explore our range of cybersecurity solutions organized by category.
            </p>
          </div>

          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-500 transition-colors h-full flex flex-col p-6">
                    {/* Category Icon/Badge */}
                    <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-700 transition-colors">
                      <span className="text-xl text-white">📁</span>
                    </div>

                    {/* Category Info */}
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                      {category.name}
                    </h3>

                    {category.description && (
                      <p className="text-gray-400 text-sm flex-1">{category.description}</p>
                    )}

                    {/* Arrow */}
                    <div className="mt-4 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No categories available at this time.</p>
            </div>
          )}
        </div>
      </div>
  );
}

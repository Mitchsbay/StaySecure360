import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Articles | Stay Secure 360',
  description: 'Read our latest cybersecurity articles and guides.',
};

async function getArticles() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return articles || [];
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-dark-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Security Articles</h1>
            <p className="text-lg text-gray-300">
              Stay informed with our latest cybersecurity insights and best practices.
            </p>
          </div>

          {/* Articles Grid */}
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group"
                >
                  <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-500 transition-colors h-full flex flex-col">
                    {/* Article Image */}
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

                    {/* Article Info */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-400 transition-colors">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-dark-800 text-xs text-gray-500">
                        <span>
                          {article.created_at
                            ? new Date(article.created_at).toLocaleDateString()
                            : 'No date'}
                        </span>
                        <span className="text-primary-400">Read More →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No articles available at this time.</p>
            </div>
          )}
        </div>
      </div>
  );
}

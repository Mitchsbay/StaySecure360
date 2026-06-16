import PublicLayout from '@/components/public/PublicLayout';
import { supabase } from '@/lib/supabase-client';

async function getHomeData() {
  const [categories, products, landingPages, articles] = await Promise.all([
    supabase.from('categories').select('*').eq('status', 'published').limit(6),
    supabase.from('products').select('*').in('status', ['published', 'coming_soon']).eq('featured', true).limit(4),
    supabase.from('landing_pages').select('*').eq('status', 'published').eq('featured', true).limit(4),
    supabase.from('articles').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(3),
  ]);

  return {
    categories: categories.data || [],
    products: products.data || [],
    landingPages: landingPages.data || [],
    articles: articles.data || [],
  };
}

export default async function HomePage() {
  const { categories, products, landingPages, articles } = await getHomeData();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-dark-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Practical Safety & Security Guides for{' '}
              <span className="text-primary-400">Everyday Life</span>
            </h1>
            <p className="text-lg sm:text-xl text-dark-300 leading-relaxed mb-8">
              Stay Secure 360 creates practical digital guides, checklists, and resources to help people protect their homes, families, businesses, and everyday life.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/products" className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                Browse Products
              </a>
              <a href="/articles" className="inline-flex items-center px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-lg font-medium border border-dark-700 transition-colors">
                Read Articles
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-white mb-8">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <a key={cat.id} href={`/categories/${cat.slug}`} className="group bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-primary-600/50 transition-all">
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors mb-2">{cat.name}</h3>
                {cat.description && <p className="text-dark-400 text-sm">{cat.description}</p>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-white mb-8">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {products.map((prod) => (
              <a key={prod.id} href={`/products/${prod.slug}`} className="group bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-600/50 transition-all">
                {prod.cover_image_url && (
                  <div className="aspect-video bg-dark-800">
                    <img src={prod.cover_image_url} alt={prod.cover_image_alt || prod.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors mb-2">{prod.title}</h3>
                  {prod.description && <p className="text-dark-400 text-sm mb-3 line-clamp-2">{prod.description}</p>}
                  {prod.price && <p className="text-primary-400 font-semibold">${prod.price} {prod.currency || 'AUD'}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured Landing Pages */}
      {landingPages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-white mb-8">Free Checklists & Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {landingPages.map((lp) => (
              <a key={lp.id} href={`/landing/${lp.slug}`} className="group bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-primary-600/50 transition-all">
                <span className="inline-block px-2 py-1 bg-primary-600/20 text-primary-400 text-xs font-medium rounded mb-3">{lp.template_type?.replace('_', ' ')}</span>
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors mb-2">{lp.hero_title || lp.title}</h3>
                {lp.hero_subtitle && <p className="text-dark-400 text-sm">{lp.hero_subtitle}</p>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Latest Articles */}
      {articles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-white mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art) => (
              <a key={art.id} href={`/articles/${art.slug}`} className="group bg-dark-900 border border-dark-800 rounded-xl overflow-hidden hover:border-primary-600/50 transition-all">
                {art.featured_image_url && (
                  <div className="aspect-video bg-dark-800">
                    <img src={art.featured_image_url} alt={art.featured_image_alt || art.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors mb-2">{art.title}</h3>
                  {art.excerpt && <p className="text-dark-400 text-sm line-clamp-2">{art.excerpt}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Email Capture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-primary-900/30 to-dark-900 border border-primary-800/30 rounded-xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Stay Informed</h2>
          <p className="text-dark-300 mb-6 max-w-xl mx-auto">Get practical safety tips and new resource alerts delivered to your inbox.</p>
          <form action="/api/subscribe" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" name="email" placeholder="Your email address" required className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <button type="submit" className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors">Subscribe</button>
          </form>
        </div>
      </section>

      {/* About */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Why Stay Secure 360?</h2>
          <p className="text-dark-300 leading-relaxed">
            We create practical, no-nonsense resources designed for real people. Our guides, checklists, and templates are built to help you take action — not just read about safety. Whether you are protecting an ageing parent, securing your home, preparing for emergencies, or safeguarding your small business, our resources give you a clear starting point.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}

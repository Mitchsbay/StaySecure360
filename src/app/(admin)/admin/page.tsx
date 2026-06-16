import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

async function getStats() {
  const [categories, products, landingPages, articles, leadMagnets, subscribers] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('landing_pages').select('id', { count: 'exact', head: true }),
    supabase.from('articles').select('id', { count: 'exact', head: true }),
    supabase.from('lead_magnets').select('id', { count: 'exact', head: true }),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }),
  ]);

  return {
    categories: categories.count || 0,
    products: products.count || 0,
    landingPages: landingPages.count || 0,
    articles: articles.count || 0,
    leadMagnets: leadMagnets.count || 0,
    subscribers: subscribers.count || 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      label: 'Categories',
      count: stats.categories,
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      color: 'primary',
    },
    {
      label: 'Products',
      count: stats.products,
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      color: 'primary',
    },
    {
      label: 'Landing Pages',
      count: stats.landingPages,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'primary',
    },
    {
      label: 'Articles',
      count: stats.articles,
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
      color: 'primary',
    },
    {
      label: 'Lead Magnets',
      count: stats.leadMagnets,
      icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'primary',
    },
    {
      label: 'Subscribers',
      count: stats.subscribers,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      color: 'primary',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-2">Overview of your Stay Secure 360 content</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-dark-900 rounded-lg border border-dark-800 p-6 hover:border-dark-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-dark-400 text-sm font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.count}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="bg-dark-900 rounded-lg border border-dark-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Getting Started</h2>
          <div className="space-y-3 text-dark-400">
            <p>Welcome to the SS360 Admin Panel. Here you can manage all your content:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Create and organize content categories</li>
              <li>Manage products and landing pages</li>
              <li>Publish articles and lead magnets</li>
              <li>Track subscriber information</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

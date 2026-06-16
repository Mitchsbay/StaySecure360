import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase-client';

const BASE_URL = 'https://staysecure360.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, landingPages, articles] = await Promise.all([
    supabase.from('categories').select('slug, updated_at').eq('status', 'published'),
    supabase.from('products').select('slug, updated_at').in('status', ['published', 'coming_soon']),
    supabase.from('landing_pages').select('slug, updated_at').eq('status', 'published'),
    supabase.from('articles').select('slug, updated_at').eq('status', 'published'),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/articles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = (categories.data || []).map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = (products.data || []).map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const landingPagesSitemap: MetadataRoute.Sitemap = (landingPages.data || []).map((lp) => ({
    url: `${BASE_URL}/landing/${lp.slug}`,
    lastModified: new Date(lp.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const articlePages: MetadataRoute.Sitemap = (articles.data || []).map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...landingPagesSitemap, ...articlePages];
}

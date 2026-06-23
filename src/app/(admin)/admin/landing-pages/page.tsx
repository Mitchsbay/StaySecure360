'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  template_type: string;
  status: string;
  product_id: string | null;
  category_id: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  intro: string | null;
  benefits: string[];
  sections: Array<{ title: string; items: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
  cta_label: string;
  cta_url: string | null;
  primary_keyword: string | null;
  secondary_keywords: string | null;
  seo_title: string | null;
  seo_description: string | null;
  featured: boolean;
}

interface Product {
  id: string;
  title: string;
}

export default function LandingPagesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [products, setProducts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLandingPages();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, title')
        .order('title');

      if (!fetchError && data) {
        const productMap: { [key: string]: string } = {};
        data.forEach((p: Product) => {
          productMap[p.id] = p.title;
        });
        setProducts(productMap);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchLandingPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching landing pages:', error);
      } else {
        setLandingPages(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', deleteId);

      if (error) {
        console.error('Error deleting landing page:', error);
        alert('Failed to delete landing page');
      } else {
        setLandingPages(landingPages.filter(p => p.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete landing page');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (page: LandingPage) => {
    setDuplicating(page.id);
    try {
      const newSlug = `${page.slug}-copy`;

      const { error: insertError } = await supabase
        .from('landing_pages')
        .insert([
          {
            product_id: page.product_id,
            category_id: page.category_id,
            title: `${page.title} (Copy)`,
            slug: newSlug,
            template_type: page.template_type,
            hero_title: page.hero_title,
            hero_subtitle: page.hero_subtitle,
            hero_image_url: page.hero_image_url,
            hero_image_alt: page.hero_image_alt,
            intro: page.intro,
            benefits: page.benefits,
            sections: page.sections,
            faqs: page.faqs,
            cta_label: page.cta_label,
            cta_url: page.cta_url,
            primary_keyword: page.primary_keyword,
            secondary_keywords: page.secondary_keywords,
            seo_title: page.seo_title,
            seo_description: page.seo_description,
            featured: false,
            status: 'draft',
          },
        ]);

      if (insertError) {
        console.error('Error duplicating landing page:', insertError);
        alert('Failed to duplicate landing page');
      } else {
        await fetchLandingPages();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to duplicate landing page');
    } finally {
      setDuplicating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-dark-800 text-dark-300',
      'published': 'bg-success-500/20 text-success-400',
    };
    return colors[status] || colors['draft'];
  };

  const getTemplateBadge = (templateType: string) => {
    const colors: { [key: string]: string } = {
      'product': 'bg-primary-500/20 text-primary-400',
      'checklist': 'bg-blue-500/20 text-blue-400',
      'lead_magnet': 'bg-purple-500/20 text-purple-400',
      'article_to_product': 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[templateType] || colors['product'];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Landing Pages</h1>
            <p className="text-dark-400 mt-2">Manage landing pages and conversion funnels</p>
          </div>
          <Link
            href="/admin/landing-pages/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-500 transition-colors self-start sm:self-auto"
          >
            New Landing Page
          </Link>
        </div>

        {/* Landing Pages Table */}
        <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-dark-400">Loading landing pages...</div>
          ) : landingPages.length === 0 ? (
            <div className="p-6 text-center text-dark-400">
              No landing pages found.{' '}
              <Link href="/admin/landing-pages/new" className="text-primary-500 hover:text-primary-400">
                Create one now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-800 bg-dark-800/50">
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Template</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-dark-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {landingPages.map((page) => (
                    <tr key={page.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-white font-medium">{page.title}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">
                        {page.product_id && products[page.product_id] ? products[page.product_id] : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTemplateBadge(page.template_type)}`}>
                          {page.template_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(page.status)}`}>
                          {page.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-right space-x-2">
                        <Link
                          href={`/admin/landing-pages/${page.id}`}
                          className="text-primary-500 hover:text-primary-400 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDuplicate(page)}
                          disabled={duplicating === page.id}
                          className="text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
                        >
                          {duplicating === page.id ? 'Duplicating...' : 'Duplicate'}
                        </button>
                        <button
                          onClick={() => setDeleteId(page.id)}
                          className="text-error-500 hover:text-error-400 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-lg border border-dark-800 max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Delete Landing Page</h2>
            <p className="text-dark-300">Are you sure you want to delete this landing page? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 text-dark-300 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-500 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

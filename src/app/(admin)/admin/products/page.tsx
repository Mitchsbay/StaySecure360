'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface Product {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creatingLandingPage, setCreatingLandingPage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, slug, status, price, category_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('status', 'published')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteId);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      } else {
        setProducts(products.filter(p => p.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateLandingPage = async (productId: string) => {
    setCreatingLandingPage(productId);
    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        alert('Product not found');
        return;
      }

      const { data: productData, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError || !productData) {
        alert('Failed to fetch product details');
        return;
      }

      const landingPageSlug = `${productData.slug}-landing`;

      const { error: insertError } = await supabase
        .from('landing_pages')
        .insert([
          {
            product_id: productId,
            category_id: productData.category_id,
            title: productData.title,
            slug: landingPageSlug,
            template_type: 'product',
            hero_title: productData.title,
            hero_subtitle: productData.description,
            hero_image_url: productData.cover_image_url,
            hero_image_alt: productData.cover_image_alt,
            benefits: productData.benefits || [],
            faqs: productData.faqs || [],
            cta_label: 'View Product',
            cta_url: `/products/${productData.slug}`,
            status: 'draft',
          },
        ]);

      if (insertError) {
        console.error('Error creating landing page:', insertError);
        alert('Failed to create landing page');
      } else {
        alert('Landing page created successfully!');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create landing page');
    } finally {
      setCreatingLandingPage(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-dark-800 text-dark-300',
      'coming_soon': 'bg-amber-500/20 text-amber-400',
      'published': 'bg-success-500/20 text-success-400',
    };
    return colors[status] || colors['draft'];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Products</h1>
            <p className="text-dark-400 mt-2">Manage your products</p>
          </div>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-500 transition-colors self-start sm:self-auto"
          >
            New Product
          </Link>
        </div>

        {/* Products Table */}
        <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-dark-400">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center text-dark-400">
              No products found.{' '}
              <Link href="/admin/products/new" className="text-primary-500 hover:text-primary-400">
                Create one now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-800 bg-dark-800/50">
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-dark-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-white font-medium">{product.title}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">{getCategoryName(product.category_id)}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">
                        {product.price ? `$${parseFloat(product.price as any).toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-right space-x-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-primary-500 hover:text-primary-400 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleCreateLandingPage(product.id)}
                          disabled={creatingLandingPage === product.id}
                          className="text-primary-500 hover:text-primary-400 transition-colors disabled:opacity-50"
                        >
                          {creatingLandingPage === product.id ? 'Creating...' : 'Create LP'}
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
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
            <h2 className="text-lg font-semibold text-white">Delete Product</h2>
            <p className="text-dark-300">Are you sure you want to delete this product? This action cannot be undone.</p>
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface Category {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, status')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data || []);
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
        .from('categories')
        .delete()
        .eq('id', deleteId);

      if (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      } else {
        setCategories(categories.filter(c => c.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-dark-800 text-dark-300',
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
            <h1 className="text-3xl font-bold text-white">Categories</h1>
            <p className="text-dark-400 mt-2">Manage product categories</p>
          </div>
          <Link
            href="/admin/categories/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-500 transition-colors self-start sm:self-auto"
          >
            New Category
          </Link>
        </div>

        {/* Categories Table */}
        <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-dark-400">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-center text-dark-400">
              No categories found.{' '}
              <Link href="/admin/categories/new" className="text-primary-500 hover:text-primary-400">
                Create one now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-800 bg-dark-800/50">
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Slug</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-dark-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-white font-medium">{category.name}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">{category.slug}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(category.status)}`}>
                          {category.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-right space-x-2">
                        <Link
                          href={`/admin/categories/${category.id}`}
                          className="text-primary-500 hover:text-primary-400 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteId(category.id)}
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
            <h2 className="text-lg font-semibold text-white">Delete Category</h2>
            <p className="text-dark-300">Are you sure you want to delete this category? This action cannot be undone.</p>
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { ImageUpload } from '@/components/admin/ImageUpload';
import AdminLayout from '@/components/admin/AdminLayout';
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
}

export default function EditCategoryPage() {
  const params = useParams();
  const id = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        setError('Failed to load category');
        setLoading(false);
        return;
      }

      if (data) {
        setCategory(data);
        setName(data.name);
        setSlug(data.slug);
        setDescription(data.description || '');
        setStatus(data.status);
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        setFeaturedImageUrl(data.featured_image_url || '');
        setFeaturedImageAlt(data.featured_image_alt || '');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while loading the category');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Only auto-generate if slug matches the original or was previously auto-generated
    const currentSlug = slug;
    const originalSlug = category?.slug || '';
    if (currentSlug === originalSlug || currentSlug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!status) {
      setError('Status is required');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          status,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          featured_image_url: featuredImageUrl || null,
          featured_image_alt: featuredImageAlt.trim() || null,
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      router.push('/admin/categories');
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while updating the category');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-dark-400">Loading category...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!category) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Category Not Found</h1>
            <p className="text-dark-400 mt-2">The category you're looking for doesn't exist.</p>
          </div>
          <button
            onClick={() => router.push('/admin/categories')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors font-medium"
          >
            Back to Categories
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Category</h1>
          <p className="text-dark-400 mt-2">Update category information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-dark-900 rounded-lg border border-dark-800 p-6">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Security Tools"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Slug Field */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-white mb-2">
                Slug *
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., security-tools"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-dark-400 mt-1">Auto-generated from name, but you can edit it manually</p>
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a detailed description of this category"
                rows={4}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              />
            </div>

            {/* Status Field */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-white mb-2">
                Status *
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* SEO Title Field */}
            <div>
              <label htmlFor="seoTitle" className="block text-sm font-medium text-white mb-2">
                SEO Title
              </label>
              <input
                id="seoTitle"
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Title for search engines (60 chars recommended)"
                maxLength={60}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-dark-400 mt-1">
                {seoTitle.length}/60
              </p>
            </div>

            {/* SEO Description Field */}
            <div>
              <label htmlFor="seoDescription" className="block text-sm font-medium text-white mb-2">
                SEO Description
              </label>
              <textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description for search engines (160 chars recommended)"
                maxLength={160}
                rows={3}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              />
              <p className="text-xs text-dark-400 mt-1">
                {seoDescription.length}/160
              </p>
            </div>

            {/* Featured Image */}
            <div>
              <ImageUpload
                bucket="categories"
                value={featuredImageUrl}
                onChange={setFeaturedImageUrl}
                altValue={featuredImageAlt}
                onAltChange={setFeaturedImageAlt}
                label="Featured Image"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-dark-800">
              <button
                type="button"
                onClick={() => router.push('/admin/categories')}
                disabled={saving}
                className="px-4 py-2 text-dark-300 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
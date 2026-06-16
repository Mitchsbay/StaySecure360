'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { FileUpload } from '@/components/admin/ImageUpload';
import AdminLayout from '@/components/admin/AdminLayout';

interface Product {
  id: string;
  title: string;
}

interface LandingPage {
  id: string;
  title: string;
}

export default function NewLeadMagnetPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [filePath, setFilePath] = useState('');
  const [relatedProductId, setRelatedProductId] = useState('');
  const [relatedLandingPageId, setRelatedLandingPageId] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [productsRes, pagesRes] = await Promise.all([
        supabase.from('products').select('id, title').order('title'),
        supabase.from('landing_pages').select('id, title').order('title'),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (pagesRes.data) setLandingPages(pagesRes.data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Only auto-generate if slug is empty or matches previous auto-generated slug
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
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

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('lead_magnets')
        .insert([
          {
            title: title.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            file_path: filePath || null,
            related_product_id: relatedProductId || null,
            related_landing_page_id: relatedLandingPageId || null,
            status,
          },
        ]);

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push('/admin/lead-magnets');
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while creating the lead magnet');
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">New Lead Magnet</h1>
          <p className="text-dark-400 mt-2">Create a new lead magnet resource</p>
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

            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Security Checklist"
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
                placeholder="e.g., security-checklist"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-dark-400 mt-1">Auto-generated from title, but you can edit it manually</p>
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
                placeholder="Enter a detailed description of this lead magnet"
                rows={4}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <FileUpload
                bucket="lead-magnet-files"
                value={filePath}
                onChange={setFilePath}
                label="File (PDF, ZIP, etc.)"
                accept=".pdf,.zip,.docx,.xlsx"
              />
            </div>

            {/* Related Product Dropdown */}
            <div>
              <label htmlFor="relatedProduct" className="block text-sm font-medium text-white mb-2">
                Related Product
              </label>
              <select
                id="relatedProduct"
                value={relatedProductId}
                onChange={(e) => setRelatedProductId(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <option value="">-- Select a product (optional) --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Related Landing Page Dropdown */}
            <div>
              <label htmlFor="relatedPage" className="block text-sm font-medium text-white mb-2">
                Related Landing Page
              </label>
              <select
                id="relatedPage"
                value={relatedLandingPageId}
                onChange={(e) => setRelatedLandingPageId(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <option value="">-- Select a landing page (optional) --</option>
                {landingPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
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

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-dark-800">
              <button
                type="button"
                onClick={() => router.push('/admin/lead-magnets')}
                disabled={loading}
                className="px-4 py-2 text-dark-300 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating...' : 'Create Lead Magnet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

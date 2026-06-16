'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { ImageUpload } from '@/components/admin/ImageUpload';
import AdminLayout from '@/components/admin/AdminLayout';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category_id: string | null;
  product_id: string | null;
  landing_page_id: string | null;
  featured: boolean;
  status: string;
  primary_keyword: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
}

interface LandingPage {
  id: string;
  title: string;
}

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [landingPageId, setLandingPageId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState('draft');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);

  const [activeTab, setActiveTab] = useState<'basics' | 'content' | 'seo'>('basics');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState('');
  const [duplicateModal, setDuplicateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [articleRes, categoriesRes, productsRes, landingPagesRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('categories')
          .select('id, name')
          .eq('status', 'published')
          .order('name'),
        supabase
          .from('products')
          .select('id, title')
          .eq('status', 'published')
          .order('title'),
        supabase
          .from('landing_pages')
          .select('id, title')
          .eq('status', 'published')
          .order('title'),
      ]);

      if (articleRes.error) {
        setError('Failed to load article');
        setLoading(false);
        return;
      }

      if (articleRes.data) {
        setArticle(articleRes.data);
        setTitle(articleRes.data.title);
        setSlug(articleRes.data.slug);
        setExcerpt(articleRes.data.excerpt || '');
        setContent(articleRes.data.content || '');
        setCategoryId(articleRes.data.category_id || '');
        setProductId(articleRes.data.product_id || '');
        setLandingPageId(articleRes.data.landing_page_id || '');
        setFeatured(articleRes.data.featured || false);
        setStatus(articleRes.data.status);
        setPrimaryKeyword(articleRes.data.primary_keyword || '');
        setFeaturedImageUrl(articleRes.data.featured_image_url || '');
        setFeaturedImageAlt(articleRes.data.featured_image_alt || '');
        setSeoTitle(articleRes.data.seo_title || '');
        setSeoDescription(articleRes.data.seo_description || '');
      }

      if (categoriesRes.error) {
        console.error('Error fetching categories:', categoriesRes.error);
      } else {
        setCategories(categoriesRes.data || []);
      }

      if (productsRes.error) {
        console.error('Error fetching products:', productsRes.error);
      } else {
        setProducts(productsRes.data || []);
      }

      if (landingPagesRes.error) {
        console.error('Error fetching landing pages:', landingPagesRes.error);
      } else {
        setLandingPages(landingPagesRes.data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while loading the article');
    } finally {
      setLoading(false);
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
    // Only auto-generate if slug matches the original or was previously auto-generated
    const currentSlug = slug;
    const originalSlug = article?.slug || '';
    if (currentSlug === originalSlug || currentSlug === generateSlug(title)) {
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
    if (!categoryId) {
      setError('Category is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    if (!status) {
      setError('Status is required');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          category_id: categoryId || null,
          product_id: productId || null,
          landing_page_id: landingPageId || null,
          featured: featured,
          status,
          primary_keyword: primaryKeyword.trim() || null,
          featured_image_url: featuredImageUrl || null,
          featured_image_alt: featuredImageAlt.trim() || null,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      router.push('/admin/articles');
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while updating the article');
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!article) return;

    setDuplicating(true);
    try {
      const newSlug = `${article.slug}-copy`;
      const newTitle = `${article.title} (Copy)`;

      const { data: newArticle, error: insertError } = await supabase
        .from('articles')
        .insert([
          {
            title: newTitle,
            slug: newSlug,
            category_id: article.category_id,
            product_id: article.product_id,
            landing_page_id: article.landing_page_id,
            excerpt: article.excerpt,
            content: article.content,
            featured_image_url: article.featured_image_url,
            featured_image_alt: article.featured_image_alt,
            primary_keyword: article.primary_keyword,
            status: 'draft',
            seo_title: article.seo_title,
            seo_description: article.seo_description,
            featured: false,
          },
        ])
        .select();

      if (insertError) {
        console.error('Error duplicating article:', insertError);
        alert('Failed to duplicate article');
        setDuplicating(false);
        return;
      }

      if (newArticle && newArticle[0]) {
        router.push(`/admin/articles/${newArticle[0].id}`);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to duplicate article');
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-dark-400">Loading article...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!article) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Article Not Found</h1>
            <p className="text-dark-400 mt-2">The article you're looking for doesn't exist.</p>
          </div>
          <button
            onClick={() => router.push('/admin/articles')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors font-medium"
          >
            Back to Articles
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Article</h1>
            <p className="text-dark-400 mt-2">Update article information</p>
          </div>
          <button
            onClick={() => setDuplicateModal(true)}
            disabled={duplicating}
            className="px-4 py-2 bg-dark-800 text-white rounded-lg font-medium hover:bg-dark-700 transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            Duplicate
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {/* Error Message */}
          {error && (
            <div className="p-6 pb-0">
              <div className="p-4 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0 border-b border-dark-800">
            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'basics'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Basics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'content'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === 'seo'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              SEO
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Basics Tab */}
              {activeTab === 'basics' && (
                <>
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
                      placeholder="e.g., Complete Guide to Home Security Systems"
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
                      placeholder="e.g., complete-guide-home-security-systems"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-dark-400 mt-1">Auto-generated from title, but you can edit it manually</p>
                  </div>

                  {/* Category Field */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-white mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
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

                  {/* Featured Checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      id="featured"
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 bg-dark-800 border border-dark-700 rounded cursor-pointer"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-white cursor-pointer">
                      Mark as Featured
                    </label>
                  </div>

                  {/* Excerpt Field */}
                  <div>
                    <label htmlFor="excerpt" className="block text-sm font-medium text-white mb-2">
                      Excerpt
                    </label>
                    <textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="A brief summary of the article (1-2 sentences)"
                      rows={3}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>
                </>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <>
                  {/* Featured Image */}
                  <div>
                    <ImageUpload
                      bucket="content-images"
                      value={featuredImageUrl}
                      onChange={setFeaturedImageUrl}
                      altValue={featuredImageAlt}
                      onAltChange={setFeaturedImageAlt}
                      label="Featured Image"
                    />
                  </div>

                  {/* Content Field */}
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-white mb-2">
                      Content *
                    </label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Article content (HTML supported)"
                      rows={12}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors font-mono text-xs resize-vertical"
                    />
                  </div>

                  {/* Related Product Field */}
                  <div>
                    <label htmlFor="product" className="block text-sm font-medium text-white mb-2">
                      Related Product
                    </label>
                    <select
                      id="product"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">No related product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Related Landing Page Field */}
                  <div>
                    <label htmlFor="landingPage" className="block text-sm font-medium text-white mb-2">
                      Related Landing Page
                    </label>
                    <select
                      id="landingPage"
                      value={landingPageId}
                      onChange={(e) => setLandingPageId(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">No related landing page</option>
                      {landingPages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Primary Keyword Field */}
                  <div>
                    <label htmlFor="primaryKeyword" className="block text-sm font-medium text-white mb-2">
                      Primary Keyword
                    </label>
                    <input
                      id="primaryKeyword"
                      type="text"
                      value={primaryKeyword}
                      onChange={(e) => setPrimaryKeyword(e.target.value)}
                      placeholder="e.g., home security systems"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end p-6 border-t border-dark-800">
            <button
              type="button"
              onClick={() => router.push('/admin/articles')}
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
        </form>
      </div>

      {/* Duplicate Confirmation Modal */}
      {duplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-lg border border-dark-800 max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Duplicate Article</h2>
            <p className="text-dark-300">This will create a copy of the article with status "Draft". You will be redirected to edit the copy.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDuplicateModal(false)}
                disabled={duplicating}
                className="px-4 py-2 text-dark-300 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50"
              >
                {duplicating ? 'Duplicating...' : 'Duplicate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

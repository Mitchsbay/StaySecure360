'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { ImageUpload, FileUpload } from '@/components/admin/ImageUpload';
import { RepeatableText, RepeatableFAQ } from '@/components/admin/RepeatableField';
import AdminLayout from '@/components/admin/AdminLayout';

interface Product {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  price: number | null;
  currency: string;
  status: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  preview_image_url: string | null;
  preview_image_alt: string | null;
  product_file_path: string | null;
  audience: string | null;
  included_items: string[];
  benefits: string[];
  faqs: Array<{ question: string; answer: string }>;
  seo_title: string | null;
  seo_description: string | null;
  button_label: string;
  checkout_url: string | null;
  featured: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [status, setStatus] = useState('draft');
  const [audience, setAudience] = useState('');
  const [featured, setFeatured] = useState(false);

  // Media fields
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewImageAlt, setPreviewImageAlt] = useState('');
  const [productFilePath, setProductFilePath] = useState('');

  // Content fields
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);

  // SEO fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [buttonLabel, setButtonLabel] = useState('Buy Now');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basics' | 'media' | 'content' | 'seo'>('basics');
  const [creatingLandingPage, setCreatingLandingPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        setError('Failed to load product');
        setLoading(false);
        return;
      }

      if (data) {
        setProduct(data);
        setTitle(data.title);
        setSlug(data.slug);
        setCategoryId(data.category_id || '');
        setDescription(data.description || '');
        setPrice(data.price ? data.price.toString() : '');
        setCurrency(data.currency || 'AUD');
        setStatus(data.status || 'draft');
        setAudience(data.audience || '');
        setFeatured(data.featured || false);
        setCoverImageUrl(data.cover_image_url || '');
        setCoverImageAlt(data.cover_image_alt || '');
        setPreviewImageUrl(data.preview_image_url || '');
        setPreviewImageAlt(data.preview_image_alt || '');
        setProductFilePath(data.product_file_path || '');
        setIncludedItems(Array.isArray(data.included_items) ? data.included_items : []);
        setBenefits(Array.isArray(data.benefits) ? data.benefits : []);
        setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        setButtonLabel(data.button_label || 'Buy Now');
        setCheckoutUrl(data.checkout_url || '');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while loading the product');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('status', 'published')
        .order('name');

      if (fetchError) {
        console.error('Error fetching categories:', fetchError);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

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
    const originalSlug = product?.slug || '';
    if (currentSlug === originalSlug || currentSlug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation - only required fields
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
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!price) {
      setError('Price is required');
      return;
    }
    if (!status) {
      setError('Status is required');
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: title.trim(),
          slug: slug.trim(),
          category_id: categoryId || null,
          description: description.trim() || null,
          price: price ? parseFloat(price) : null,
          currency: currency || 'AUD',
          status,
          audience: audience.trim() || null,
          featured,
          cover_image_url: coverImageUrl || null,
          cover_image_alt: coverImageAlt.trim() || null,
          preview_image_url: previewImageUrl || null,
          preview_image_alt: previewImageAlt.trim() || null,
          product_file_path: productFilePath || null,
          included_items: includedItems.filter(i => i.trim()).length > 0 ? includedItems.filter(i => i.trim()) : [],
          benefits: benefits.filter(b => b.trim()).length > 0 ? benefits.filter(b => b.trim()) : [],
          faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          button_label: buttonLabel.trim() || 'Buy Now',
          checkout_url: checkoutUrl.trim() || null,
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      router.push('/admin/products');
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while updating the product');
      setSaving(false);
    }
  };

  const handleCreateLandingPage = async () => {
    if (!product) return;

    setCreatingLandingPage(true);
    try {
      const landingPageSlug = `${product.slug}-landing`;

      const { error: insertError } = await supabase
        .from('landing_pages')
        .insert([
          {
            product_id: id,
            category_id: product.category_id,
            title: product.title,
            slug: landingPageSlug,
            template_type: 'product',
            hero_title: product.title,
            hero_subtitle: product.description,
            hero_image_url: product.cover_image_url,
            hero_image_alt: product.cover_image_alt,
            benefits: product.benefits || [],
            faqs: product.faqs || [],
            cta_label: 'View Product',
            cta_url: `/products/${product.slug}`,
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
      setCreatingLandingPage(false);
    }
  };

  const TabButton = ({ tab, label }: { tab: 'basics' | 'media' | 'content' | 'seo'; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
        activeTab === tab
          ? 'bg-primary-600 text-white'
          : 'bg-dark-800 text-dark-400 hover:text-dark-300'
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-dark-400">Loading product...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Product Not Found</h1>
            <p className="text-dark-400 mt-2">The product you're looking for doesn't exist.</p>
          </div>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors font-medium"
          >
            Back to Products
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
            <h1 className="text-3xl font-bold text-white">Edit Product</h1>
            <p className="text-dark-400 mt-2">Update product information</p>
          </div>
          <button
            onClick={handleCreateLandingPage}
            disabled={creatingLandingPage}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50 font-medium self-start sm:self-auto"
          >
            {creatingLandingPage ? 'Creating...' : 'Create Landing Page'}
          </button>
        </div>

        {/* Form with Tabs */}
        <form onSubmit={handleSubmit} className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex gap-0 border-b border-dark-800 bg-dark-950 p-0">
            <TabButton tab="basics" label="Basics" />
            <TabButton tab="media" label="Media" />
            <TabButton tab="content" label="Content" />
            <TabButton tab="seo" label="SEO" />
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm">
                {error}
              </div>
            )}

            {/* Basics Tab */}
            {activeTab === 'basics' && (
              <div className="space-y-6">
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
                    placeholder="e.g., Advanced Security Course"
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
                    placeholder="e.g., advanced-security-course"
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
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a detailed description of this product"
                    rows={4}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                  />
                </div>

                {/* Price Field */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-white mb-2">
                      Price *
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-white mb-2">
                      Currency
                    </label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="AUD">AUD</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
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
                    <option value="coming_soon">Coming Soon</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                {/* Audience Field */}
                <div>
                  <label htmlFor="audience" className="block text-sm font-medium text-white mb-2">
                    Audience
                  </label>
                  <input
                    id="audience"
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Small Business Owners"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Featured Checkbox */}
                <div className="flex items-center">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 bg-dark-800 border border-dark-700 rounded focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm font-medium text-white cursor-pointer">
                    Featured Product
                  </label>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Cover Image */}
                <div>
                  <ImageUpload
                    bucket="product-covers"
                    value={coverImageUrl}
                    onChange={setCoverImageUrl}
                    altValue={coverImageAlt}
                    onAltChange={setCoverImageAlt}
                    label="Cover Image"
                  />
                </div>

                {/* Preview Image */}
                <div>
                  <ImageUpload
                    bucket="product-previews"
                    value={previewImageUrl}
                    onChange={setPreviewImageUrl}
                    altValue={previewImageAlt}
                    onAltChange={setPreviewImageAlt}
                    label="Preview Image"
                  />
                </div>

                {/* Product File */}
                <div>
                  <FileUpload
                    bucket="product-files"
                    value={productFilePath}
                    onChange={setProductFilePath}
                    label="Product File (PDF, ZIP, etc.)"
                  />
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Included Items */}
                <div>
                  <RepeatableText
                    label="Included Items"
                    items={includedItems}
                    onChange={setIncludedItems}
                    placeholder="e.g., Video training modules"
                  />
                </div>

                {/* Benefits */}
                <div>
                  <RepeatableText
                    label="Benefits"
                    items={benefits}
                    onChange={setBenefits}
                    placeholder="e.g., Learn industry best practices"
                  />
                </div>

                {/* FAQs */}
                <div>
                  <RepeatableFAQ
                    label="FAQs"
                    items={faqs}
                    onChange={setFaqs}
                  />
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                {/* Button Label */}
                <div>
                  <label htmlFor="buttonLabel" className="block text-sm font-medium text-white mb-2">
                    Button Label
                  </label>
                  <input
                    id="buttonLabel"
                    type="text"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    placeholder="Buy Now"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Checkout URL */}
                <div>
                  <label htmlFor="checkoutUrl" className="block text-sm font-medium text-white mb-2">
                    Checkout URL
                  </label>
                  <input
                    id="checkoutUrl"
                    type="url"
                    value={checkoutUrl}
                    onChange={(e) => setCheckoutUrl(e.target.value)}
                    placeholder="https://checkout.example.com"
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
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
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-dark-800">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
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

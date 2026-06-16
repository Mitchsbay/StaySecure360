'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { RepeatableText, RepeatableFAQ, RepeatableSections } from '@/components/admin/RepeatableField';
import AdminLayout from '@/components/admin/AdminLayout';

interface Product {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

export default function NewLandingPagePage() {
  // Basic fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [productId, setProductId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [templateType, setTemplateType] = useState('product');
  const [status, setStatus] = useState('draft');
  const [featured, setFeatured] = useState(false);

  // Hero section
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [intro, setIntro] = useState('');

  // Content
  const [benefits, setBenefits] = useState<string[]>([]);
  const [sections, setSections] = useState<Array<{ title: string; items: string[] }>>([]);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [ctaLabel, setCtaLabel] = useState('View Product');
  const [ctaUrl, setCtaUrl] = useState('');

  // SEO
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // UI State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basics' | 'hero' | 'content' | 'seo'>('basics');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, title')
        .order('title');

      if (fetchError) {
        console.error('Error fetching products:', fetchError);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, name')
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
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation - required fields
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!productId) {
      setError('Product is required');
      return;
    }
    if (!categoryId) {
      setError('Category is required');
      return;
    }
    if (!templateType) {
      setError('Template type is required');
      return;
    }
    if (!heroTitle.trim()) {
      setError('Hero title is required');
      return;
    }
    if (!heroSubtitle.trim()) {
      setError('Hero subtitle is required');
      return;
    }
    if (!status) {
      setError('Status is required');
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('landing_pages')
        .insert([
          {
            product_id: productId || null,
            category_id: categoryId || null,
            title: title.trim(),
            slug: slug.trim(),
            template_type: templateType,
            hero_title: heroTitle.trim(),
            hero_subtitle: heroSubtitle.trim(),
            hero_image_url: heroImageUrl || null,
            hero_image_alt: heroImageAlt.trim() || null,
            intro: intro.trim() || null,
            benefits: benefits.filter(b => b.trim()),
            sections: sections.filter(s => s.title.trim()),
            faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
            cta_label: ctaLabel.trim() || 'View Product',
            cta_url: ctaUrl.trim() || null,
            primary_keyword: primaryKeyword.trim() || null,
            secondary_keywords: secondaryKeywords.trim() || null,
            seo_title: seoTitle.trim() || null,
            seo_description: seoDescription.trim() || null,
            featured,
            status,
          },
        ]);

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push('/admin/landing-pages');
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while creating the landing page');
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basics', label: 'Basics' },
    { id: 'hero', label: 'Hero' },
    { id: 'content', label: 'Content' },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">New Landing Page</h1>
          <p className="text-dark-400 mt-2">Create a new landing page</p>
        </div>

        {/* Form with Tabs */}
        <form onSubmit={handleSubmit} className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-dark-800 bg-dark-950 p-4">
            <div className="flex gap-2 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm">
                  {error}
                </div>
              )}

              {/* BASICS TAB */}
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
                      placeholder="e.g., Security for SMBs"
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
                      placeholder="e.g., security-for-smbs"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-dark-400 mt-1">Auto-generated from title, but you can edit it manually</p>
                  </div>

                  {/* Product Dropdown */}
                  <div>
                    <label htmlFor="productId" className="block text-sm font-medium text-white mb-2">
                      Product *
                    </label>
                    <select
                      id="productId"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select a product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-white mb-2">
                      Category *
                    </label>
                    <select
                      id="categoryId"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template Type Dropdown */}
                  <div>
                    <label htmlFor="templateType" className="block text-sm font-medium text-white mb-2">
                      Template Type *
                    </label>
                    <select
                      id="templateType"
                      value={templateType}
                      onChange={(e) => setTemplateType(e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="product">Product</option>
                      <option value="checklist">Checklist</option>
                      <option value="lead_magnet">Lead Magnet</option>
                      <option value="article_to_product">Article to Product</option>
                    </select>
                  </div>

                  {/* Status Dropdown */}
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
                  <div className="flex items-center gap-2">
                    <input
                      id="featured"
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border border-dark-700 bg-dark-800 accent-primary-600 cursor-pointer"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-white cursor-pointer">
                      Featured
                    </label>
                  </div>
                </div>
              )}

              {/* HERO TAB */}
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  {/* Hero Title */}
                  <div>
                    <label htmlFor="heroTitle" className="block text-sm font-medium text-white mb-2">
                      Hero Title *
                    </label>
                    <input
                      id="heroTitle"
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="Main headline for the hero section"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Hero Subtitle */}
                  <div>
                    <label htmlFor="heroSubtitle" className="block text-sm font-medium text-white mb-2">
                      Hero Subtitle *
                    </label>
                    <textarea
                      id="heroSubtitle"
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      placeholder="Secondary headline for the hero section"
                      rows={3}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>

                  {/* Hero Image */}
                  <div>
                    <ImageUpload
                      bucket="landing-pages"
                      value={heroImageUrl}
                      onChange={setHeroImageUrl}
                      altValue={heroImageAlt}
                      onAltChange={setHeroImageAlt}
                      label="Hero Image"
                    />
                  </div>

                  {/* Intro */}
                  <div>
                    <label htmlFor="intro" className="block text-sm font-medium text-white mb-2">
                      Intro Text
                    </label>
                    <textarea
                      id="intro"
                      value={intro}
                      onChange={(e) => setIntro(e.target.value)}
                      placeholder="Introduction paragraph below the hero section"
                      rows={4}
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {/* CONTENT TAB */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Benefits */}
                  <div>
                    <RepeatableText
                      label="Benefits"
                      items={benefits}
                      onChange={setBenefits}
                      placeholder="Enter a benefit..."
                    />
                  </div>

                  {/* Sections */}
                  <div>
                    <RepeatableSections
                      label="Content Sections"
                      items={sections}
                      onChange={setSections}
                    />
                  </div>

                  {/* FAQs */}
                  <div>
                    <RepeatableFAQ
                      label="Frequently Asked Questions"
                      items={faqs}
                      onChange={setFaqs}
                    />
                  </div>

                  {/* CTA Label */}
                  <div>
                    <label htmlFor="ctaLabel" className="block text-sm font-medium text-white mb-2">
                      CTA Button Label
                    </label>
                    <input
                      id="ctaLabel"
                      type="text"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      placeholder="e.g., View Product"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* CTA URL */}
                  <div>
                    <label htmlFor="ctaUrl" className="block text-sm font-medium text-white mb-2">
                      CTA URL
                    </label>
                    <input
                      id="ctaUrl"
                      type="text"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* SEO TAB */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* Primary Keyword */}
                  <div>
                    <label htmlFor="primaryKeyword" className="block text-sm font-medium text-white mb-2">
                      Primary Keyword
                    </label>
                    <input
                      id="primaryKeyword"
                      type="text"
                      value={primaryKeyword}
                      onChange={(e) => setPrimaryKeyword(e.target.value)}
                      placeholder="Main keyword for SEO"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Secondary Keywords */}
                  <div>
                    <label htmlFor="secondaryKeywords" className="block text-sm font-medium text-white mb-2">
                      Secondary Keywords
                    </label>
                    <input
                      id="secondaryKeywords"
                      type="text"
                      value={secondaryKeywords}
                      onChange={(e) => setSecondaryKeywords(e.target.value)}
                      placeholder="Comma-separated secondary keywords"
                      className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* SEO Title */}
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
                    <p className="text-xs text-dark-400 mt-1">{seoTitle.length}/60</p>
                  </div>

                  {/* SEO Description */}
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
                    <p className="text-xs text-dark-400 mt-1">{seoDescription.length}/160</p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t border-dark-800 mt-6">
              <button
                type="button"
                onClick={() => router.push('/admin/landing-pages')}
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
                {loading ? 'Creating...' : 'Create Landing Page'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

interface Article {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

interface TemplateType {
  value: string;
  label: string;
  content: string;
}

const TEMPLATES: TemplateType[] = [
  {
    value: 'how-to',
    label: 'How-to Article',
    content: '<h2>Introduction</h2><p>Explain what readers will learn...</p><h2>Step-by-Step Guide</h2><p>Step 1: ...</p><p>Step 2: ...</p><h2>Tips for Success</h2><p>...</p><h2>Conclusion</h2><p>...</p>',
  },
  {
    value: 'checklist',
    label: 'Checklist Article',
    content: '<h2>Introduction</h2><p>...</p><h2>Checklist</h2><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul><h2>Conclusion</h2><p>...</p>',
  },
  {
    value: 'safety-tips',
    label: 'Safety Tips Article',
    content: '<h2>Introduction</h2><p>...</p><h2>Key Safety Tips</h2><p>Tip 1: ...</p><p>Tip 2: ...</p><h2>Common Mistakes to Avoid</h2><p>...</p><h2>Conclusion</h2><p>...</p>',
  },
  {
    value: 'buyer-guide',
    label: 'Buyer Guide Article',
    content: '<h2>Introduction</h2><p>...</p><h2>What to Look For</h2><p>...</p><h2>Top Recommendations</h2><p>...</p><h2>Conclusion</h2><p>...</p>',
  },
  {
    value: 'faq',
    label: 'FAQ Article',
    content: '<h2>Introduction</h2><p>...</p><h2>Frequently Asked Questions</h2><h3>Question 1?</h3><p>Answer...</p><h3>Question 2?</h3><p>Answer...</p><h2>Conclusion</h2><p>...</p>',
  },
];

export default function ArticlesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase
          .from('articles')
          .select('id, title, slug, category_id, status')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('status', 'published'),
      ]);

      if (articlesRes.error) {
        console.error('Error fetching articles:', articlesRes.error);
      } else {
        setArticles(articlesRes.data || []);
      }

      if (categoriesRes.error) {
        console.error('Error fetching categories:', categoriesRes.error);
      } else {
        setCategories(categoriesRes.data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', deleteId);

      if (error) {
        console.error('Error deleting article:', error);
        alert('Failed to delete article');
      } else {
        setArticles(articles.filter(a => a.id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateId) return;

    setDuplicating(true);
    try {
      const articleToDuplicate = articles.find(a => a.id === duplicateId);
      if (!articleToDuplicate) {
        alert('Article not found');
        setDuplicating(false);
        return;
      }

      const { data: fullArticle, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', duplicateId)
        .single();

      if (fetchError || !fullArticle) {
        alert('Failed to fetch article details');
        setDuplicating(false);
        return;
      }

      const newSlug = `${fullArticle.slug}-copy`;
      const newTitle = `${fullArticle.title} (Copy)`;

      const { data: newArticle, error: insertError } = await supabase
        .from('articles')
        .insert([
          {
            title: newTitle,
            slug: newSlug,
            category_id: fullArticle.category_id,
            product_id: fullArticle.product_id,
            landing_page_id: fullArticle.landing_page_id,
            excerpt: fullArticle.excerpt,
            content: fullArticle.content,
            featured_image_url: fullArticle.featured_image_url,
            featured_image_alt: fullArticle.featured_image_alt,
            primary_keyword: fullArticle.primary_keyword,
            status: 'draft',
            seo_title: fullArticle.seo_title,
            seo_description: fullArticle.seo_description,
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

  const handleCreateFromTemplate = async (templateValue: string) => {
    const template = TEMPLATES.find(t => t.value === templateValue);
    if (!template) return;

    setTemplateOpen(false);
    const timestamp = Date.now();
    const newSlug = `new-${templateValue}-article-${timestamp}`;
    const newTitle = `New ${template.label}`;

    try {
      const { data: newArticle, error } = await supabase
        .from('articles')
        .insert([
          {
            title: newTitle,
            slug: newSlug,
            content: template.content,
            status: 'draft',
            featured: false,
          },
        ])
        .select();

      if (error) {
        console.error('Error creating article from template:', error);
        alert('Failed to create article from template');
        return;
      }

      if (newArticle && newArticle[0]) {
        router.push(`/admin/articles/${newArticle[0].id}`);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create article from template');
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
            <h1 className="text-3xl font-bold text-white">Articles</h1>
            <p className="text-dark-400 mt-2">Manage security articles</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-auto">
            <button
              onClick={() => setTemplateOpen(true)}
              className="px-4 py-2 bg-dark-800 text-white rounded-lg font-medium hover:bg-dark-700 transition-colors"
            >
              Create From Template
            </button>
            <Link
              href="/admin/articles/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-500 transition-colors text-center"
            >
              New Article
            </Link>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-dark-400">Loading articles...</div>
          ) : articles.length === 0 ? (
            <div className="p-6 text-center text-dark-400">
              No articles found.{' '}
              <Link href="/admin/articles/new" className="text-primary-500 hover:text-primary-400">
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
                    <th className="px-6 py-3 text-left text-sm font-medium text-dark-300">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-dark-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-white font-medium">{article.title}</td>
                      <td className="px-6 py-3 text-sm text-dark-300">{getCategoryName(article.category_id)}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(article.status)}`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-right space-x-3">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-primary-500 hover:text-primary-400 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDuplicateId(article.id)}
                          disabled={duplicating}
                          className="text-dark-300 hover:text-dark-200 transition-colors disabled:opacity-50"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => setDeleteId(article.id)}
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

      {/* Template Selection Modal */}
      {templateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-lg border border-dark-800 max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Create Article From Template</h2>
            <p className="text-sm text-dark-300">Select a template to start with a pre-filled article structure.</p>
            <div className="space-y-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.value}
                  onClick={() => handleCreateFromTemplate(template.value)}
                  className="w-full px-4 py-2 text-left bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
                >
                  {template.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-dark-800">
              <button
                onClick={() => setTemplateOpen(false)}
                className="px-4 py-2 text-dark-300 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-lg border border-dark-800 max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Delete Article</h2>
            <p className="text-dark-300">Are you sure you want to delete this article? This action cannot be undone.</p>
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

      {/* Duplicate Confirmation Modal */}
      {duplicateId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-lg border border-dark-800 max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Duplicate Article</h2>
            <p className="text-dark-300">This will create a copy of the article with status "Draft". You will be redirected to edit the copy.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDuplicateId(null)}
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

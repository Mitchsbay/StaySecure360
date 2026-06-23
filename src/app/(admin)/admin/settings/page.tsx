'use client';

import { useState, useEffect, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { ImageUpload } from '@/components/admin/ImageUpload';
import AdminLayout from '@/components/admin/AdminLayout';

interface SiteSettings {
  id: string;
  brand_name: string;
  site_url: string | null;
  logo_url: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [brandName, setBrandName] = useState('Stay Secure 360');
  const [siteUrl, setSiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [defaultSeoTitle, setDefaultSeoTitle] = useState('');
  const [defaultSeoDescription, setDefaultSeoDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected for new sites
        console.error('Error fetching settings:', fetchError);
      }

      if (data) {
        setSettings(data);
        setBrandName(data.brand_name || 'Stay Secure 360');
        setSiteUrl(data.site_url || '');
        setLogoUrl(data.logo_url || '');
        setDefaultSeoTitle(data.default_seo_title || '');
        setDefaultSeoDescription(data.default_seo_description || '');
      } else {
        // No settings exist, we'll create defaults on submit
        setSettings(null);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!brandName.trim()) {
      setError('Brand name is required');
      return;
    }

    setSaving(true);
    try {
      if (settings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({
            brand_name: brandName.trim(),
            site_url: siteUrl.trim() || null,
            logo_url: logoUrl || null,
            default_seo_title: defaultSeoTitle.trim() || null,
            default_seo_description: defaultSeoDescription.trim() || null,
          })
          .eq('id', settings.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
      } else {
        // Insert new settings
        const { data: newSettings, error: insertError } = await supabase
          .from('site_settings')
          .insert([
            {
              brand_name: brandName.trim(),
              site_url: siteUrl.trim() || null,
              logo_url: logoUrl || null,
              default_seo_title: defaultSeoTitle.trim() || null,
              default_seo_description: defaultSeoDescription.trim() || null,
            },
          ])
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }

        if (newSettings) {
          setSettings(newSettings);
        }
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-dark-400">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Site Settings</h1>
          <p className="text-dark-400 mt-2">Configure global site settings</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-dark-900 rounded-lg border border-dark-800 p-6 max-w-2xl">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 rounded-lg bg-success-500/10 border border-success-500/30 text-success-400 text-sm">
                {success}
              </div>
            )}

            {/* Brand Name Field */}
            <div>
              <label htmlFor="brandName" className="block text-sm font-medium text-white mb-2">
                Brand Name *
              </label>
              <input
                id="brandName"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Stay Secure 360"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Site URL Field */}
            <div>
              <label htmlFor="siteUrl" className="block text-sm font-medium text-white mb-2">
                Site URL
              </label>
              <input
                id="siteUrl"
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <ImageUpload
                bucket="site-assets"
                value={logoUrl}
                onChange={setLogoUrl}
                label="Logo"
              />
            </div>

            {/* Default SEO Title */}
            <div>
              <label htmlFor="defaultSeoTitle" className="block text-sm font-medium text-white mb-2">
                Default SEO Title
              </label>
              <input
                id="defaultSeoTitle"
                type="text"
                value={defaultSeoTitle}
                onChange={(e) => setDefaultSeoTitle(e.target.value)}
                placeholder="Default title for SEO (60 chars recommended)"
                maxLength={60}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-dark-400 mt-1">
                {defaultSeoTitle.length}/60
              </p>
            </div>

            {/* Default SEO Description */}
            <div>
              <label htmlFor="defaultSeoDescription" className="block text-sm font-medium text-white mb-2">
                Default SEO Description
              </label>
              <textarea
                id="defaultSeoDescription"
                value={defaultSeoDescription}
                onChange={(e) => setDefaultSeoDescription(e.target.value)}
                placeholder="Default meta description for SEO (160 chars recommended)"
                maxLength={160}
                rows={3}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              />
              <p className="text-xs text-dark-400 mt-1">
                {defaultSeoDescription.length}/160
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-dark-800">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

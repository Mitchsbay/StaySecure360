-- ============================================================
-- StaySecure360 — Supabase Storage Setup
-- Run this in your Supabase SQL Editor AFTER running schema.sql
--
-- This creates the 'article-images' storage bucket and sets
-- the correct public access policies so:
--   - Anyone can VIEW images (public read)
--   - Only authenticated admins/editors can UPLOAD images
-- ============================================================

-- ── 1. Create the storage bucket ────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,                          -- public bucket (images are publicly accessible)
  5242880,                       -- 5 MB max file size
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

-- ── 2. Public read policy (anyone can view images) ──────────
DROP POLICY IF EXISTS "Public read access for article images" ON storage.objects;
CREATE POLICY "Public read access for article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- ── 3. Admin/editor upload policy ───────────────────────────
DROP POLICY IF EXISTS "Admins and editors can upload article images" ON storage.objects;
CREATE POLICY "Admins and editors can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-images'
  AND auth.role() = 'authenticated'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('admin', 'editor')
);

-- ── 4. Admin/editor delete policy ───────────────────────────
DROP POLICY IF EXISTS "Admins and editors can delete article images" ON storage.objects;
CREATE POLICY "Admins and editors can delete article images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images'
  AND auth.role() = 'authenticated'
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('admin', 'editor')
);

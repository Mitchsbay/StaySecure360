-- ============================================================
-- StaySecure360 — Row Level Security (RLS) Policies
-- Run AFTER schema.sql in your Supabase SQL Editor.
--
-- IMPORTANT: This version fixes the "infinite recursion detected
-- in policy for relation profiles" error by using a SECURITY
-- DEFINER helper function instead of self-referencing subqueries.
-- ============================================================

-- ============================================================
-- HELPER FUNCTION
-- A SECURITY DEFINER function runs with the privileges of the
-- function owner (postgres), bypassing RLS entirely.
-- This breaks the recursion: policies on other tables call this
-- function to check the user's role without triggering the
-- profiles RLS policies again.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running this script
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can read their own profile only
-- NOTE: We do NOT use get_my_role() here to avoid recursion on this table.
-- The admin client (service role) is used server-side for admin profile lookups.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- TOPICS
-- ============================================================
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Topics are publicly readable" ON public.topics;
DROP POLICY IF EXISTS "Admins and editors can manage topics" ON public.topics;

-- Anyone can read topics (public)
CREATE POLICY "Topics are publicly readable"
  ON public.topics FOR SELECT
  USING (true);

-- Only admins/editors can insert/update/delete topics
CREATE POLICY "Admins and editors can manage topics"
  ON public.topics FOR ALL
  USING (public.get_my_role() IN ('admin', 'editor'));

-- ============================================================
-- ARTICLES
-- ============================================================
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published articles are publicly readable" ON public.articles;
DROP POLICY IF EXISTS "Admins and editors can read all articles" ON public.articles;
DROP POLICY IF EXISTS "Admins and editors can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Admins and editors can update articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;

-- Public can only read published articles
CREATE POLICY "Published articles are publicly readable"
  ON public.articles FOR SELECT
  USING (status = 'published');

-- Admins/editors can read all articles (including drafts)
CREATE POLICY "Admins and editors can read all articles"
  ON public.articles FOR SELECT
  USING (public.get_my_role() IN ('admin', 'editor'));

-- Admins/editors can insert articles
CREATE POLICY "Admins and editors can insert articles"
  ON public.articles FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin', 'editor'));

-- Admins/editors can update articles
CREATE POLICY "Admins and editors can update articles"
  ON public.articles FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'editor'));

-- Only admins can delete articles
CREATE POLICY "Admins can delete articles"
  ON public.articles FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ============================================================
-- FAQS
-- ============================================================
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FAQs readable for published articles" ON public.faqs;
DROP POLICY IF EXISTS "Admins and editors can read all FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins and editors can manage FAQs" ON public.faqs;

-- FAQs are readable if the linked article is published
CREATE POLICY "FAQs readable for published articles"
  ON public.faqs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id AND a.status = 'published'
    )
  );

-- Admins/editors can read all FAQs
CREATE POLICY "Admins and editors can read all FAQs"
  ON public.faqs FOR SELECT
  USING (public.get_my_role() IN ('admin', 'editor'));

-- Admins/editors can manage FAQs
CREATE POLICY "Admins and editors can manage FAQs"
  ON public.faqs FOR ALL
  USING (public.get_my_role() IN ('admin', 'editor'));

-- ============================================================
-- CHECKLIST ITEMS
-- ============================================================
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Checklist items readable for published articles" ON public.checklist_items;
DROP POLICY IF EXISTS "Admins and editors can read all checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Admins and editors can manage checklist items" ON public.checklist_items;

-- Checklist items readable if linked article is published
CREATE POLICY "Checklist items readable for published articles"
  ON public.checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id AND a.status = 'published'
    )
  );

-- Admins/editors can read all checklist items
CREATE POLICY "Admins and editors can read all checklist items"
  ON public.checklist_items FOR SELECT
  USING (public.get_my_role() IN ('admin', 'editor'));

-- Admins/editors can manage checklist items
CREATE POLICY "Admins and editors can manage checklist items"
  ON public.checklist_items FOR ALL
  USING (public.get_my_role() IN ('admin', 'editor'));

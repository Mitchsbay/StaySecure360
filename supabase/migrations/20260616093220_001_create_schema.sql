-- 1. profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text CHECK (role IN ('admin', 'editor', 'user')) DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 2. categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  status text CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  seo_title text,
  seo_description text,
  featured_image_url text,
  featured_image_alt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_categories" ON categories FOR SELECT
  TO authenticated USING (status = 'published');
CREATE POLICY "anon_read_published_categories" ON categories FOR SELECT
  TO anon USING (status = 'published');
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 3. products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric,
  currency text DEFAULT 'AUD',
  status text CHECK (status IN ('draft', 'coming_soon', 'published')) DEFAULT 'draft',
  cover_image_url text,
  cover_image_alt text,
  preview_image_url text,
  preview_image_alt text,
  product_file_path text,
  checkout_url text,
  button_label text DEFAULT 'Buy Now',
  audience text,
  included_items jsonb DEFAULT '[]',
  benefits jsonb DEFAULT '[]',
  faqs jsonb DEFAULT '[]',
  seo_title text,
  seo_description text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_products" ON products FOR SELECT
  TO authenticated USING (status IN ('published', 'coming_soon'));
CREATE POLICY "anon_read_published_products" ON products FOR SELECT
  TO anon USING (status IN ('published', 'coming_soon'));
CREATE POLICY "admin_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_products" ON products FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_products" ON products FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 4. landing_pages
CREATE TABLE landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  template_type text CHECK (template_type IN ('product', 'checklist', 'lead_magnet', 'article_to_product')) DEFAULT 'product',
  primary_keyword text,
  secondary_keywords text,
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  hero_image_alt text,
  intro text,
  benefits jsonb DEFAULT '[]',
  sections jsonb DEFAULT '[]',
  faqs jsonb DEFAULT '[]',
  cta_label text DEFAULT 'View Product',
  cta_url text,
  status text CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  seo_title text,
  seo_description text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_landing_pages" ON landing_pages FOR SELECT
  TO authenticated USING (status = 'published');
CREATE POLICY "anon_read_published_landing_pages" ON landing_pages FOR SELECT
  TO anon USING (status = 'published');
CREATE POLICY "admin_insert_landing_pages" ON landing_pages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_landing_pages" ON landing_pages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_landing_pages" ON landing_pages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 5. articles
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  landing_page_id uuid REFERENCES landing_pages(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  featured_image_url text,
  featured_image_alt text,
  primary_keyword text,
  status text CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  seo_title text,
  seo_description text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_articles" ON articles FOR SELECT
  TO authenticated USING (status = 'published');
CREATE POLICY "anon_read_published_articles" ON articles FOR SELECT
  TO anon USING (status = 'published');
CREATE POLICY "admin_insert_articles" ON articles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_articles" ON articles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_articles" ON articles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 6. lead_magnets
CREATE TABLE lead_magnets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  file_path text,
  related_product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  related_landing_page_id uuid REFERENCES landing_pages(id) ON DELETE SET NULL,
  status text CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_lead_magnets" ON lead_magnets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_insert_lead_magnets" ON lead_magnets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_lead_magnets" ON lead_magnets FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_lead_magnets" ON lead_magnets FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 7. subscribers
CREATE TABLE subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source_page text,
  lead_magnet_id uuid REFERENCES lead_magnets(id) ON DELETE SET NULL,
  consent boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_select_subscribers" ON subscribers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_insert_subscribers" ON subscribers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_subscribers" ON subscribers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
-- Public can subscribe (no auth check)
CREATE POLICY "public_insert_subscribers" ON subscribers FOR INSERT
  TO anon WITH CHECK (true);
CREATE POLICY "auth_insert_subscribers" ON subscribers FOR INSERT
  TO authenticated WITH CHECK (true);

-- 8. site_settings
CREATE TABLE site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text DEFAULT 'Stay Secure 360',
  site_url text,
  logo_url text,
  default_seo_title text,
  default_seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT
  TO anon USING (true);
CREATE POLICY "auth_read_site_settings" ON site_settings FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_insert_site_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER landing_pages_updated_at BEFORE UPDATE ON landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lead_magnets_updated_at BEFORE UPDATE ON lead_magnets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('content-images', 'content-images', true),
  ('product-covers', 'product-covers', true),
  ('product-previews', 'product-previews', true),
  ('product-files', 'product-files', false),
  ('lead-magnet-files', 'lead-magnet-files', false)
ON CONFLICT (id) DO NOTHING;

-- Public read access for public buckets
CREATE POLICY "public_read_content_images" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'content-images');
CREATE POLICY "public_read_product_covers" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'product-covers');
CREATE POLICY "public_read_product_previews" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'product-previews');

-- Authenticated read for private buckets
CREATE POLICY "auth_read_product_files" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'product-files');
CREATE POLICY "auth_read_lead_magnet_files" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'lead-magnet-files');

-- Admin/editor can insert to all buckets
CREATE POLICY "admin_insert_content_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'content-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_insert_product_covers" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'product-covers' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_insert_product_previews" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'product-previews' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_insert_product_files" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'product-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_insert_lead_magnet_files" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'lead-magnet-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Admin/editor can update files in all buckets
CREATE POLICY "admin_update_content_images" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'content-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_product_covers" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'product-covers' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_product_previews" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'product-previews' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_product_files" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'product-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_update_lead_magnet_files" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'lead-magnet-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Admin/editor can delete files from all buckets
CREATE POLICY "admin_delete_content_images" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'content-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_product_covers" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'product-covers' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_product_previews" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'product-previews' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_product_files" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'product-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "admin_delete_lead_magnet_files" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'lead-magnet-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

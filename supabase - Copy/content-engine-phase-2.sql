-- ============================================================
-- StaySecure360 — Content Engine Phase 2 Upgrade
-- Run this in Supabase SQL Editor after deploying the updated repo.
-- Safe to re-run.
-- ============================================================

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS image_prompt TEXT,
  ADD COLUMN IF NOT EXISTS image_alt_text TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS content_cluster TEXT,
  ADD COLUMN IF NOT EXISTS pillar_topic TEXT,
  ADD COLUMN IF NOT EXISTS internal_link_targets JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS ai_structure_mode TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_content_cluster ON public.articles(content_cluster);
CREATE INDEX IF NOT EXISTS idx_articles_seo_keywords ON public.articles USING GIN (seo_keywords);
CREATE INDEX IF NOT EXISTS idx_articles_internal_link_targets ON public.articles USING GIN (internal_link_targets);

CREATE TABLE IF NOT EXISTS public.content_topic_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  content_cluster TEXT,
  pillar_topic TEXT,
  intent TEXT DEFAULT 'informational',
  priority INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'drafted', 'published', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_topic_bank_status ON public.content_topic_bank(status);
CREATE INDEX IF NOT EXISTS idx_content_topic_bank_cluster ON public.content_topic_bank(content_cluster);
CREATE INDEX IF NOT EXISTS idx_content_topic_bank_category ON public.content_topic_bank(category);

DROP TRIGGER IF EXISTS set_content_topic_bank_updated_at ON public.content_topic_bank;
CREATE TRIGGER set_content_topic_bank_updated_at
  BEFORE UPDATE ON public.content_topic_bank
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.content_topic_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and editors can manage content topic bank" ON public.content_topic_bank;
CREATE POLICY "Admins and editors can manage content topic bank"
  ON public.content_topic_bank FOR ALL
  USING (public.get_my_role() IN ('admin', 'editor'))
  WITH CHECK (public.get_my_role() IN ('admin', 'editor'));

INSERT INTO public.content_topic_bank (topic, category, subcategory, content_cluster, pillar_topic, priority)
SELECT * FROM (VALUES
  ('Why Most Break-Ins Still Happen Through the Front Door', 'Physical Security', 'Access Control', 'residential-entry-points', 'Residential Security', 1),
  ('The Gap Between Locked and Secure', 'Physical Security', 'Access Control', 'access-control-failures', 'Physical Security', 1),
  ('Why CCTV Rarely Prevents Crime But Still Matters', 'Physical Security', 'Surveillance Systems', 'cctv-real-world-use', 'Physical Security', 2),
  ('The Blind Spots You Didn’t Know Your Cameras Had', 'Physical Security', 'Surveillance Systems', 'cctv-real-world-use', 'Physical Security', 2),
  ('How Predictable Routines Create Security Vulnerabilities', 'Workplace Awareness', 'Human Behaviour', 'predictability-and-routine', 'Workplace Awareness', 1),
  ('Why Good People Make Bad Security Decisions', 'Workplace Awareness', 'Human Behaviour', 'human-behaviour-risk', 'Workplace Awareness', 1),
  ('The Illusion of Safety in Modern Workplaces', 'Workplace Awareness', 'Security Culture', 'security-culture-drift', 'Workplace Awareness', 1),
  ('Why Security Policies Fail in Practice', 'Workplace Awareness', 'Security Culture', 'security-culture-drift', 'Workplace Awareness', 2),
  ('Why Public WiFi Is Still a Real Risk', 'Digital Threats', 'Network Security', 'remote-work-network-risk', 'Digital Threats', 1),
  ('How Home Networks Become Entry Points for Attackers', 'Digital Threats', 'Network Security', 'remote-work-network-risk', 'Digital Threats', 2),
  ('Why Phishing Still Works on Smart People', 'Social Engineering', 'Phishing & Deception', 'phishing-human-factors', 'Social Engineering', 1),
  ('How Attackers Exploit Urgency and Authority', 'Social Engineering', 'Phishing & Deception', 'phishing-human-factors', 'Social Engineering', 1),
  ('How Tailgating Still Works in Secured Buildings', 'Social Engineering', 'Physical Social Engineering', 'physical-social-engineering', 'Social Engineering', 1),
  ('Why People Hold Doors Open Even When They Shouldn’t', 'Social Engineering', 'Physical Social Engineering', 'physical-social-engineering', 'Social Engineering', 2),
  ('Why Security Systems Fail in Commercial Buildings', 'Physical Security', 'Building Security', 'commercial-building-security', 'Commercial Security', 1),
  ('The Risk of Handover Gaps in Security Teams', 'Incident Response', 'Operational Risk', 'handover-and-response-risk', 'Incident Response', 1),
  ('Why Most Incident Responses Are Too Slow', 'Incident Response', 'Incident Response', 'incident-response-reality', 'Incident Response', 1),
  ('The Difference Between Perceived Risk and Real Risk', 'Risk Management', 'Security Risk Management', 'risk-perception', 'Risk Management', 1)
) AS v(topic, category, subcategory, content_cluster, pillar_topic, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.content_topic_bank b WHERE lower(b.topic) = lower(v.topic)
);

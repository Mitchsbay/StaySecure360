-- ============================================================
-- StaySecure360 — Dynamic Category / Subcategory Upgrade
-- Run this once in Supabase SQL Editor for an existing project.
-- Safe to run repeatedly.
-- ============================================================

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.topics(id) ON DELETE SET NULL;

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_topics_parent_id ON public.topics(parent_id);

-- Main topic pillars
UPDATE public.topics SET parent_id = NULL, sort_order = 10 WHERE slug = 'digital-threats';
UPDATE public.topics SET parent_id = NULL, sort_order = 20 WHERE slug = 'physical-security';
UPDATE public.topics SET parent_id = NULL, sort_order = 30 WHERE slug = 'remote-work-security';
UPDATE public.topics SET parent_id = NULL, sort_order = 40 WHERE slug = 'social-engineering';
UPDATE public.topics SET parent_id = NULL, sort_order = 50 WHERE slug = 'workplace-awareness';

-- Subtopics / article-level categories
INSERT INTO public.topics (name, slug, description, icon, color, parent_id, sort_order)
SELECT v.name, v.slug, v.description, v.icon, v.color, p.id, v.sort_order
FROM (VALUES
  ('Phishing Attacks', 'phishing-attacks', 'Email and message-based scams that trick people into revealing credentials or taking unsafe actions.', 'MailWarning', '#f97316', 'digital-threats', 11),
  ('Malware & Ransomware', 'malware-ransomware', 'Malware, ransomware, malicious downloads, and practical prevention strategies.', 'Bug', '#ef4444', 'digital-threats', 12),
  ('Password Security', 'password-security', 'Password managers, MFA, account takeover prevention, and credential hygiene.', 'KeyRound', '#2563eb', 'digital-threats', 13),
  ('Data Breaches', 'data-breaches', 'How breaches happen, what exposed data means, and how individuals and organisations should respond.', 'DatabaseZap', '#7c3aed', 'digital-threats', 14),
  ('Public Wi-Fi Risks', 'public-wifi-risks', 'Security risks when using public networks in airports, hotels, cafés, and shared spaces.', 'WifiOff', '#0891b2', 'digital-threats', 15),
  ('Access Control', 'access-control', 'Badges, keys, visitor access, permissions, door controls, and access governance.', 'BadgeCheck', '#10b981', 'physical-security', 21),
  ('CCTV & Surveillance', 'cctv-surveillance', 'Camera coverage, monitoring, blind spots, retention, and surveillance governance.', 'Camera', '#059669', 'physical-security', 22),
  ('Perimeter Security', 'perimeter-security', 'Fences, gates, external doors, car parks, lighting, and boundary controls.', 'Fence', '#16a34a', 'physical-security', 23),
  ('Visitor Management', 'visitor-management', 'Reception controls, contractor sign-in, escort rules, and visitor verification.', 'ClipboardCheck', '#22c55e', 'physical-security', 24),
  ('Security Guarding', 'security-guarding', 'Security officers, patrols, incident response, handovers, and frontline procedures.', 'ShieldCheck', '#15803d', 'physical-security', 25),
  ('Home Network Security', 'home-network-security', 'Router settings, home Wi-Fi hardening, guest networks, and secure remote work setups.', 'Router', '#8b5cf6', 'remote-work-security', 31),
  ('VPNs & Secure Access', 'vpns-secure-access', 'VPNs, zero trust access, remote login hygiene, and secure connectivity.', 'LockKeyhole', '#7c3aed', 'remote-work-security', 32),
  ('Device Hardening', 'device-hardening', 'Laptop, phone, and tablet security for hybrid and remote workers.', 'Laptop', '#6d28d9', 'remote-work-security', 33),
  ('Travel Security', 'travel-security', 'Security risks when working while travelling, using hotels, airports, and shared spaces.', 'BriefcaseBusiness', '#9333ea', 'remote-work-security', 34),
  ('Pretexting', 'pretexting', 'Impersonation scenarios where attackers build a believable story to extract information or access.', 'MessageCircleWarning', '#3b82f6', 'social-engineering', 41),
  ('Vishing & Phone Scams', 'vishing-phone-scams', 'Voice-based scams, caller ID spoofing, and verification habits for phone requests.', 'PhoneCall', '#2563eb', 'social-engineering', 42),
  ('Tailgating', 'tailgating', 'How unauthorised people follow staff into secure areas and how to prevent it safely.', 'DoorOpen', '#1d4ed8', 'social-engineering', 43),
  ('Impersonation', 'impersonation', 'Fake staff, contractors, delivery drivers, executives, and authority-based manipulation.', 'UserRoundCheck', '#1e40af', 'social-engineering', 44),
  ('Security Culture', 'security-culture', 'Building habits, norms, leadership expectations, and shared responsibility for security.', 'UsersRound', '#ef4444', 'workplace-awareness', 51),
  ('Insider Threats', 'insider-threats', 'Risks from employees, contractors, trusted users, negligence, and malicious insiders.', 'UserX', '#dc2626', 'workplace-awareness', 52),
  ('Incident Response', 'incident-response', 'Reporting, escalation, evidence capture, communication, and response discipline.', 'Siren', '#b91c1c', 'workplace-awareness', 53),
  ('Security Risk Management', 'security-risk-management', 'Risk identification, assessment, controls, ownership, and security governance.', 'FileWarning', '#991b1b', 'workplace-awareness', 54),
  ('Compliance & Standards', 'compliance-standards', 'Policies, standards, audits, frameworks, and practical compliance obligations.', 'ClipboardList', '#ef4444', 'workplace-awareness', 55)
) AS v(name, slug, description, icon, color, parent_slug, sort_order)
JOIN public.topics p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order;

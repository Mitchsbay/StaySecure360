-- ============================================================
-- StaySecure360 — Seed Data
-- Run AFTER schema.sql and rls.sql.
-- Provides sample topics, articles, FAQs, and checklists.
-- ============================================================

-- ============================================================
-- TOPICS
-- ============================================================
INSERT INTO public.topics (id, name, slug, description, icon, color) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Social Engineering', 'social-engineering',
   'How attackers manipulate people into revealing information or granting access — the human side of cybersecurity.',
   'Users', '#3b82f6'),
  ('11111111-0000-0000-0000-000000000002', 'Physical Security', 'physical-security',
   'Protecting buildings, offices, and physical assets from unauthorised access, tailgating, and impersonation.',
   'Building2', '#10b981'),
  ('11111111-0000-0000-0000-000000000003', 'Digital Threats', 'digital-threats',
   'Phishing, QR scams, malware, and other online attacks targeting individuals and organisations.',
   'Shield', '#f59e0b'),
  ('11111111-0000-0000-0000-000000000004', 'Remote Work Security', 'remote-work-security',
   'Staying secure when working from home, coffee shops, or hybrid environments.',
   'Laptop', '#8b5cf6'),
  ('11111111-0000-0000-0000-000000000005', 'Workplace Awareness', 'workplace-awareness',
   'Building a security-conscious culture — recognising suspicious behaviour, visitor management, and everyday habits.',
   'Eye', '#ef4444')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ARTICLES
-- ============================================================
INSERT INTO public.articles (id, title, slug, excerpt, content, topic_id, status, meta_title, meta_description, published_at) VALUES

-- 1. What Is Social Engineering?
('22222222-0000-0000-0000-000000000001',
 'What Is Social Engineering?',
 'what-is-social-engineering',
 'Social engineering is the art of manipulating people rather than systems. Learn how attackers exploit trust, urgency, and authority to bypass even the strongest technical defences.',
 E'## What Is Social Engineering?\n\nSocial engineering is a category of attack that targets human psychology rather than technical vulnerabilities. Instead of exploiting software flaws, attackers exploit **trust, fear, urgency, and authority** to manipulate individuals into handing over credentials, granting access, or transferring money.\n\n## Why It Works\n\nHumans are wired to be helpful, to respond to authority, and to act quickly under pressure. Attackers study these tendencies and craft scenarios that trigger them. A well-executed social engineering attack can bypass firewalls, antivirus software, and multi-factor authentication in minutes.\n\n## Common Techniques\n\n**Pretexting** involves creating a fabricated scenario to extract information. An attacker might pose as an IT technician needing your password to fix an urgent issue.\n\n**Phishing** uses deceptive emails or messages that appear to come from trusted sources, directing victims to fake login pages or malicious downloads.\n\n**Vishing (voice phishing)** uses phone calls, often with spoofed caller IDs, to impersonate banks, government agencies, or internal IT departments.\n\n**Baiting** leaves infected USB drives in car parks or reception areas, counting on curiosity to do the rest.\n\n## The Digital–Physical Connection\n\nSocial engineering does not stay in the digital world. A convincing phone call can unlock a building. A fake delivery uniform can bypass a reception desk. Understanding how these attacks cross the physical–digital boundary is essential for any organisation.\n\n## How to Protect Yourself\n\nVerify identities through official channels before acting on any request. Slow down when you feel pressured to act urgently. Report suspicious interactions to your security team immediately.',
 '11111111-0000-0000-0000-000000000001',
 'published',
 'What Is Social Engineering? | StaySecure360',
 'Learn how social engineering attacks exploit human psychology to bypass technical defences — and how to protect yourself.',
 NOW() - INTERVAL '10 days'),

-- 2. How Tailgating Happens in Office Buildings
('22222222-0000-0000-0000-000000000002',
 'How Tailgating Happens in Office Buildings',
 'how-tailgating-happens-in-office-buildings',
 'Tailgating — following an authorised person through a secure door — is one of the simplest physical security breaches. Discover how it happens and what stops it.',
 E'## How Tailgating Happens in Office Buildings\n\nTailgating (also called piggybacking) is the act of following an authorised person through a secured door without presenting credentials. It is one of the most common and underestimated physical security breaches in modern workplaces.\n\n## The Typical Scenario\n\nAn attacker arrives at a secure entrance carrying boxes or coffee cups, making it socially awkward for the person ahead to let the door close. The authorised employee holds the door open out of politeness — and the attacker is inside.\n\n## Why People Allow It\n\nHolding a door for someone feels polite and natural. Challenging a stranger feels confrontational and rude. Attackers exploit this social norm deliberately, often dressing in uniforms, carrying props, or timing their approach to coincide with busy periods.\n\n## The Consequences\n\nOnce inside, an attacker can access server rooms, steal hardware, plant listening devices, access unattended workstations, or simply observe sensitive information on screens and whiteboards.\n\n## Prevention Measures\n\n- **Mantrap / airlock entries**: Two-door systems that prevent a second person entering until the first has authenticated.\n- **Security awareness training**: Teach staff that it is acceptable — and expected — to challenge unfamiliar individuals.\n- **Visitor management systems**: All visitors should be signed in, badged, and escorted.\n- **Access control audits**: Review door logs regularly for anomalous entry patterns.\n- **Clear signage**: Remind staff that tailgating is a security violation, not a social faux pas.',
 '11111111-0000-0000-0000-000000000002',
 'published',
 'How Tailgating Happens in Office Buildings | StaySecure360',
 'Tailgating is one of the simplest physical security breaches. Learn how it happens, why people allow it, and how to prevent it.',
 NOW() - INTERVAL '9 days'),

-- 3. How to Spot a QR Code Scam
('22222222-0000-0000-0000-000000000003',
 'How to Spot a QR Code Scam',
 'how-to-spot-a-qr-code-scam',
 'QR codes are everywhere — and so are fake ones. Attackers use malicious QR codes in public spaces, emails, and even physical mail to redirect victims to phishing sites.',
 E'## How to Spot a QR Code Scam\n\nQR codes have become a standard part of daily life — used for menus, payments, parking, and event check-ins. This ubiquity makes them an attractive vector for attackers, who replace or overlay legitimate QR codes with malicious ones.\n\n## How QR Code Scams Work\n\nAttackers print fake QR code stickers and place them over legitimate codes in public spaces — parking meters, restaurant tables, posters, and even bank ATMs. When a victim scans the code, they are redirected to a convincing phishing page that harvests credentials or payment details.\n\nIn email-based attacks, QR codes are embedded in messages to bypass text-based phishing filters, since the URL is encoded in an image rather than plain text.\n\n## Warning Signs\n\n- A QR code sticker that appears to be placed over an existing code\n- Unexpected redirects to login pages after scanning\n- URLs that do not match the expected organisation (check the preview before opening)\n- Requests for payment or credentials immediately after scanning\n- QR codes received in unsolicited emails or text messages\n\n## Safe Scanning Habits\n\n1. Use a QR scanner that previews the URL before opening it.\n2. Inspect physical QR codes for signs of tampering — peeling edges, misaligned stickers.\n3. Never enter payment details or passwords on a page reached via a QR code unless you are certain of its legitimacy.\n4. If in doubt, navigate to the organisation directly via your browser.\n5. Report suspicious QR codes to venue staff or your IT security team.',
 '11111111-0000-0000-0000-000000000003',
 'published',
 'How to Spot a QR Code Scam | StaySecure360',
 'QR code scams are rising. Learn how attackers use fake QR codes in public spaces and emails — and how to scan safely.',
 NOW() - INTERVAL '8 days'),

-- 4. Why Physical Security Breaches Become Cyber Incidents
('22222222-0000-0000-0000-000000000004',
 'Why Physical Security Breaches Become Cyber Incidents',
 'why-physical-security-breaches-become-cyber-incidents',
 'A stolen laptop, an unlocked workstation, or a planted USB drive can trigger a full-scale data breach. Explore how physical access translates directly into digital compromise.',
 E'## Why Physical Security Breaches Become Cyber Incidents\n\nOrganisations invest heavily in firewalls, endpoint protection, and intrusion detection — but a single physical breach can render all of it irrelevant. Physical and digital security are not separate disciplines; they are two sides of the same coin.\n\n## The Attack Paths\n\n**Stolen hardware**: A laptop or mobile device stolen from a car or hotel room may contain unencrypted data, cached credentials, or access to corporate VPNs.\n\n**Unattended workstations**: An unlocked, unattended computer in a shared space gives an attacker full access to everything the logged-in user can reach — email, files, internal systems.\n\n**Rogue devices**: A USB drive left in a car park, or a small device plugged into an accessible network port, can silently exfiltrate data or establish a persistent backdoor.\n\n**Shoulder surfing**: Watching someone type a password or PIN in a public space is a physical attack with digital consequences.\n\n**Dumpster diving**: Discarded documents, hard drives, and printed reports can contain credentials, network diagrams, and sensitive client data.\n\n## Bridging the Gap\n\nEffective security requires treating physical and digital controls as a unified system. Access control, visitor management, clean desk policies, and device encryption are not administrative overhead — they are essential layers of a defence-in-depth strategy.',
 '11111111-0000-0000-0000-000000000002',
 'published',
 'Why Physical Security Breaches Become Cyber Incidents | StaySecure360',
 'Discover how physical security failures — stolen hardware, rogue devices, unattended workstations — directly cause cyber incidents.',
 NOW() - INTERVAL '7 days'),

-- 5. Delivery Impersonation Risks in Workplaces
('22222222-0000-0000-0000-000000000005',
 'Delivery Impersonation Risks in Workplaces',
 'delivery-impersonation-risks-in-workplaces',
 'Fake couriers and delivery personnel are a proven social engineering tactic. Learn how attackers use delivery impersonation to gain physical access to secured premises.',
 E'## Delivery Impersonation Risks in Workplaces\n\nThe rise of e-commerce has normalised a constant stream of delivery personnel entering workplaces. Attackers exploit this normalisation by posing as couriers, engineers, or maintenance staff to gain unchallenged access to secured areas.\n\n## Why It Is Effective\n\nReception staff and employees are conditioned to expect deliveries. A person carrying a parcel, wearing a high-visibility vest, or holding a clipboard triggers an automatic assumption of legitimacy. Challenging them feels disruptive and rude.\n\n## Common Scenarios\n\n- A fake courier delivers a parcel containing a rogue device (e.g., a modified USB charger with a built-in keylogger)\n- An attacker in a utility uniform claims to be there for a scheduled maintenance visit that was never booked\n- A "flower delivery" is used to access a floor that requires badge access, with a real employee holding the door\n\n## Protective Measures\n\n1. **Verify all deliveries**: Cross-reference unexpected deliveries with purchasing or facilities teams before accepting.\n2. **Require ID**: All external visitors, including couriers, should present identification.\n3. **Designated reception areas**: Deliveries should never bypass the reception desk.\n4. **Pre-register expected visitors**: Facilities teams should maintain a daily expected visitor log.\n5. **Train reception staff**: Empower them to challenge and escalate, without fear of being seen as unhelpful.',
 '11111111-0000-0000-0000-000000000002',
 'published',
 'Delivery Impersonation Risks in Workplaces | StaySecure360',
 'Fake couriers are a real threat. Learn how delivery impersonation is used to gain physical access — and how to stop it.',
 NOW() - INTERVAL '6 days'),

-- 6. Why Visitor Management Matters
('22222222-0000-0000-0000-000000000006',
 'Why Visitor Management Matters',
 'why-visitor-management-matters',
 'A robust visitor management process is one of the most effective physical security controls. Discover what good visitor management looks like and why it matters.',
 E'## Why Visitor Management Matters\n\nEvery person who enters your premises without proper verification is a potential security risk. Visitor management is not bureaucratic overhead — it is a fundamental security control that protects people, data, and assets.\n\n## What Good Visitor Management Looks Like\n\n**Pre-registration**: Visitors are expected and their details are recorded before arrival. Reception staff know who to expect and when.\n\n**Identity verification**: Visitors present photo ID, which is checked against the pre-registration record.\n\n**Visitor badges**: Time-limited, visually distinct badges that clearly identify the person as a visitor and indicate which areas they are permitted to access.\n\n**Escort policies**: Visitors are accompanied by an authorised employee at all times in secure areas.\n\n**Sign-out process**: Visitor records are closed when the person leaves, and badges are returned.\n\n**Digital logs**: Electronic visitor management systems provide an auditable record of who entered, when, and with whom.\n\n## The Risks of Poor Visitor Management\n\n- Unauthorised individuals accessing sensitive areas\n- No audit trail in the event of a security incident\n- Visitor badges being cloned, retained, or reused\n- Tailgating enabled by a lack of challenge culture\n\n## Visitor Management and Compliance\n\nMany regulatory frameworks — including ISO 27001, SOC 2, and industry-specific standards — require documented visitor management procedures. A robust process supports both security and compliance objectives.',
 '11111111-0000-0000-0000-000000000002',
 'published',
 'Why Visitor Management Matters | StaySecure360',
 'Visitor management is a critical physical security control. Learn what good visitor management looks like and why it matters.',
 NOW() - INTERVAL '5 days'),

-- 7. Security Tips for Remote and Hybrid Workers
('22222222-0000-0000-0000-000000000007',
 'Security Tips for Remote and Hybrid Workers',
 'security-tips-for-remote-and-hybrid-workers',
 'Working from home or a coffee shop introduces security risks that the office environment controls for. Here is how to stay secure wherever you work.',
 E'## Security Tips for Remote and Hybrid Workers\n\nThe shift to remote and hybrid working has expanded the attack surface for organisations significantly. Home networks, personal devices, and public Wi-Fi introduce risks that the controlled office environment manages by default.\n\n## Securing Your Home Network\n\n- Change the default admin password on your router immediately.\n- Use WPA3 encryption if your router supports it; WPA2 as a minimum.\n- Create a separate guest network for IoT devices and personal devices.\n- Keep your router firmware updated.\n\n## Device Security\n\n- Use only company-approved devices for work tasks.\n- Enable full-disk encryption (BitLocker on Windows, FileVault on macOS).\n- Lock your screen whenever you step away — even at home.\n- Never connect work devices to public USB charging ports (juice jacking).\n\n## Public Wi-Fi\n\nPublic Wi-Fi in cafes, hotels, and airports is inherently untrusted. Always use your organisation''s VPN when connecting to work systems over public networks. If a VPN is not available, use your mobile data connection instead.\n\n## Video Calls and Shoulder Surfing\n\n- Be aware of what is visible behind you on video calls — whiteboards, documents, and screens.\n- Use a privacy screen on your laptop in public spaces.\n- Ensure family members or housemates cannot overhear sensitive calls.\n\n## Phishing Awareness\n\nRemote workers are prime phishing targets. Without colleagues nearby to sanity-check suspicious emails, individuals are more vulnerable. Apply the same scepticism at home as you would in the office.',
 '11111111-0000-0000-0000-000000000004',
 'published',
 'Security Tips for Remote and Hybrid Workers | StaySecure360',
 'Remote work introduces unique security risks. Learn practical tips to stay secure whether working from home, a cafe, or a hybrid setup.',
 NOW() - INTERVAL '4 days'),

-- 8. Suspicious Behaviour Red Flags
('22222222-0000-0000-0000-000000000008',
 'Suspicious Behaviour Red Flags',
 'suspicious-behaviour-red-flags',
 'Recognising suspicious behaviour is a skill every employee can develop. Learn the red flags that security professionals look for in physical and workplace environments.',
 E'## Suspicious Behaviour Red Flags\n\nSecurity is not solely the responsibility of the security team. Every employee is a potential observer and reporter of suspicious activity. Knowing what to look for — and feeling empowered to report it — is one of the most effective security controls available.\n\n## Physical Environment Red Flags\n\n- Someone loitering near access-controlled doors without badging in\n- A person photographing security equipment, access panels, or server rooms\n- Individuals accessing areas they have no apparent reason to be in\n- Someone attempting to look over shoulders at screens or documents\n- Vehicles parked for extended periods near secure entry points\n\n## Behavioural Red Flags\n\n- Nervousness, evasiveness, or reluctance to make eye contact when challenged\n- Claiming to be from IT, maintenance, or management without prior notice\n- Excessive interest in security procedures, shift patterns, or access controls\n- Attempting to access systems or areas outside normal working hours\n- Pressure to act quickly or bypass normal procedures\n\n## Digital Red Flags\n\n- Unexpected password reset emails or login alerts\n- Colleagues receiving unusual requests from your email address\n- Unfamiliar devices appearing on the office network\n- Unexplained files or applications on workstations\n\n## What to Do\n\nDo not confront suspicious individuals alone. Report concerns to your security team, facilities manager, or line manager. Document what you observed — time, location, description — as accurately as possible.',
 '11111111-0000-0000-0000-000000000005',
 'published',
 'Suspicious Behaviour Red Flags | StaySecure360',
 'Learn the physical and digital red flags that indicate suspicious behaviour — and how to report them effectively.',
 NOW() - INTERVAL '3 days'),

-- 9. How Phishing Exploits Human Behaviour
('22222222-0000-0000-0000-000000000009',
 'How Phishing Exploits Human Behaviour',
 'how-phishing-exploits-human-behaviour',
 'Phishing is the most common cyber attack vector — not because technology fails, but because humans are predictable. Understand the psychology behind phishing and how to resist it.',
 E'## How Phishing Exploits Human Behaviour\n\nPhishing remains the most prevalent initial access vector in cyber attacks, not because technical defences are absent, but because attackers have learned to exploit predictable human psychology with remarkable precision.\n\n## The Six Principles of Influence\n\nRobert Cialdini''s six principles of influence — reciprocity, commitment, social proof, authority, liking, and scarcity — are the psychological levers that phishing attacks pull.\n\n**Authority**: "This is your CEO. Transfer the funds immediately." Emails appearing to come from executives, regulators, or IT departments trigger compliance instincts.\n\n**Urgency and scarcity**: "Your account will be suspended in 24 hours." Time pressure short-circuits careful thinking.\n\n**Social proof**: "Your colleagues have already updated their credentials." Normalising the action reduces resistance.\n\n**Fear**: Threat of consequences — account closure, legal action, security breach — overrides rational evaluation.\n\n## Spear Phishing\n\nGeneric phishing casts a wide net. Spear phishing is targeted — attackers research their victim on LinkedIn, company websites, and social media to craft a highly personalised and convincing message. These attacks are significantly more effective and harder to detect.\n\n## Defending Against Phishing\n\n- Slow down before clicking any link or opening any attachment.\n- Verify unexpected requests through a separate, trusted channel (call the person directly).\n- Check the sender''s actual email address, not just the display name.\n- Report suspicious emails — do not just delete them.\n- Participate in phishing simulation training to build recognition skills.',
 '11111111-0000-0000-0000-000000000003',
 'published',
 'How Phishing Exploits Human Behaviour | StaySecure360',
 'Phishing works because humans are predictable. Learn the psychology behind phishing attacks and how to build resistance.',
 NOW() - INTERVAL '2 days'),

-- 10. Everyday Security Habits That Actually Matter
('22222222-0000-0000-0000-000000000010',
 'Everyday Security Habits That Actually Matter',
 'everyday-security-habits-that-actually-matter',
 'Security does not have to be complicated. These practical everyday habits significantly reduce your risk — at work and at home.',
 E'## Everyday Security Habits That Actually Matter\n\nSecurity awareness training is valuable, but it is daily habits that create lasting protection. The following practices are simple, practical, and collectively make a significant difference.\n\n## Password and Authentication\n\n- Use a password manager to generate and store unique, strong passwords for every account.\n- Enable multi-factor authentication (MFA) on every account that supports it — especially email, banking, and work systems.\n- Never reuse passwords across different services.\n\n## Device and Screen Habits\n\n- Lock your screen every time you leave your desk — make it a reflex.\n- Apply a clean desk policy: no sensitive documents left visible when you are away.\n- Use privacy screens in public spaces and on public transport.\n\n## Email and Communication\n\n- Pause before clicking any link or opening any attachment, even from known senders.\n- Verify unexpected requests — especially those involving money, credentials, or access — through a separate channel.\n- Report suspicious emails to your IT or security team rather than just deleting them.\n\n## Physical Awareness\n\n- Do not hold doors open for people you do not recognise.\n- Challenge unfamiliar individuals in secure areas politely but firmly.\n- Be aware of who can see your screen or hear your conversations in public.\n\n## Software and Updates\n\n- Apply software updates promptly — most attacks exploit known, patched vulnerabilities.\n- Do not install software from untrusted sources.\n- Review app permissions on mobile devices regularly.',
 '11111111-0000-0000-0000-000000000005',
 'published',
 'Everyday Security Habits That Actually Matter | StaySecure360',
 'Simple everyday security habits make a big difference. Learn the practical routines that reduce your risk at work and at home.',
 NOW() - INTERVAL '1 day')

ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- FAQS
-- ============================================================
INSERT INTO public.faqs (article_id, question, answer, sort_order) VALUES

-- Social Engineering FAQs
('22222222-0000-0000-0000-000000000001', 'What is the most common form of social engineering?', 'Phishing is the most prevalent form, typically delivered via email. However, vishing (voice calls) and pretexting are also widely used, particularly in targeted attacks against organisations.', 1),
('22222222-0000-0000-0000-000000000001', 'Can social engineering be prevented by technology alone?', 'No. Technology can reduce the attack surface, but social engineering targets human behaviour. Effective prevention requires a combination of technical controls, security awareness training, and a culture of verification.', 2),
('22222222-0000-0000-0000-000000000001', 'How do I report a suspected social engineering attempt?', 'Report it to your IT security team or line manager immediately. Document what happened — the time, method, and what was requested. Do not feel embarrassed; reporting is the right action.', 3),

-- Tailgating FAQs
('22222222-0000-0000-0000-000000000002', 'Is it rude to challenge someone who tailgates?', 'No. Security-conscious organisations expect and encourage staff to politely challenge unfamiliar individuals. Most organisations provide training on how to do this respectfully. It is a professional responsibility, not a social faux pas.', 1),
('22222222-0000-0000-0000-000000000002', 'What should I say if I need to challenge a tailgater?', 'A simple, polite approach works well: "Hi, I don''t think we''ve met — do you have your access badge?" If they cannot produce one, offer to escort them to reception. Never physically confront anyone.', 2),

-- QR Code FAQs
('22222222-0000-0000-0000-000000000003', 'Are all QR codes dangerous?', 'No — QR codes are a legitimate and widely used technology. The risk comes from malicious QR codes placed in public spaces or sent in phishing messages. Safe scanning habits significantly reduce your risk.', 1),
('22222222-0000-0000-0000-000000000003', 'How can I check where a QR code leads before opening it?', 'Most modern smartphone cameras and QR scanner apps display a URL preview before opening the link. Always check this preview and look for signs that the domain matches the expected organisation.', 2),

-- Remote Work FAQs
('22222222-0000-0000-0000-000000000007', 'Is my home Wi-Fi secure enough for work?', 'It can be, with the right configuration. Change your router''s default admin password, use WPA2 or WPA3 encryption, keep firmware updated, and always use your organisation''s VPN for work tasks.', 1),
('22222222-0000-0000-0000-000000000007', 'Can I use a public USB charging port for my work laptop?', 'No. Public USB ports can be used in "juice jacking" attacks to install malware or steal data. Use your own charger and a standard power outlet, or use a USB data blocker if you must use a public port.', 2),

-- Phishing FAQs
('22222222-0000-0000-0000-000000000009', 'What should I do if I accidentally clicked a phishing link?', 'Disconnect from the network immediately, then report the incident to your IT security team. Do not attempt to fix it yourself. Change any passwords you may have entered. The sooner you report it, the better the outcome.', 1),
('22222222-0000-0000-0000-000000000009', 'How do I tell if an email is a phishing attempt?', 'Check the sender''s actual email address (not just the display name), look for urgency or threats, hover over links before clicking, and be sceptical of unexpected requests — even from known contacts.', 2);

-- ============================================================
-- CHECKLIST ITEMS
-- ============================================================
INSERT INTO public.checklist_items (article_id, item, sort_order) VALUES

-- Social Engineering Checklist
('22222222-0000-0000-0000-000000000001', 'Verify the identity of anyone requesting sensitive information through an official channel', 1),
('22222222-0000-0000-0000-000000000001', 'Slow down when you feel pressured to act urgently', 2),
('22222222-0000-0000-0000-000000000001', 'Report suspicious interactions to your security team immediately', 3),
('22222222-0000-0000-0000-000000000001', 'Attend security awareness training at least annually', 4),

-- Tailgating Checklist
('22222222-0000-0000-0000-000000000002', 'Badge in individually — do not hold the door for unrecognised individuals', 1),
('22222222-0000-0000-0000-000000000002', 'Politely challenge anyone who enters without badging', 2),
('22222222-0000-0000-0000-000000000002', 'Report tailgating incidents to your security or facilities team', 3),
('22222222-0000-0000-0000-000000000002', 'Ensure all visitors are signed in and escorted', 4),

-- Remote Work Checklist
('22222222-0000-0000-0000-000000000007', 'Change your router''s default admin password', 1),
('22222222-0000-0000-0000-000000000007', 'Enable WPA2 or WPA3 encryption on your home Wi-Fi', 2),
('22222222-0000-0000-0000-000000000007', 'Use your organisation''s VPN on all public networks', 3),
('22222222-0000-0000-0000-000000000007', 'Lock your screen whenever you step away from your device', 4),
('22222222-0000-0000-0000-000000000007', 'Use a privacy screen in public spaces', 5),

-- Everyday Habits Checklist
('22222222-0000-0000-0000-000000000010', 'Use a password manager and unique passwords for every account', 1),
('22222222-0000-0000-0000-000000000010', 'Enable MFA on all accounts that support it', 2),
('22222222-0000-0000-0000-000000000010', 'Lock your screen every time you leave your desk', 3),
('22222222-0000-0000-0000-000000000010', 'Apply a clean desk policy — no sensitive documents left visible', 4),
('22222222-0000-0000-0000-000000000010', 'Apply software updates promptly', 5),
('22222222-0000-0000-0000-000000000010', 'Report suspicious emails rather than just deleting them', 6);

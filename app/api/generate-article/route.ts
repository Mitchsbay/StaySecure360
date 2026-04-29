// ============================================================
// /api/generate-article — Server-side OpenAI article generation
//
// REQUIRED ENVIRONMENT VARIABLES (set in Vercel or .env.local):
//   OPENAI_API_KEY              — Your OpenAI API key (server-side only)
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY
//
// HOW IT WORKS:
//   The client calls this endpoint once for article text + CMS metadata.
//   If the user requested an image, the client makes a second call to
//   /api/generate-image using the image_prompt returned here.
// ============================================================
export const dynamic = 'force-dynamic'
export const maxDuration = 180

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { validateArticle, generateValidationReport } from '@/lib/article-validation'
import type { GenerateArticleRequest, GeneratedArticleDraft, InternalLinkTarget } from '@/types'

type StructureMode =
  | 'article_only'
  | 'article_with_short_checklist'
  | 'article_with_short_faq'
  | 'article_with_checklist_and_faq'

const structureModes: StructureMode[] = [
  'article_only',
  'article_with_short_checklist',
  'article_with_short_faq',
  'article_with_checklist_and_faq',
]

type TopicCandidate = {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

const normaliseName = (input?: string | null) =>
  input
    ?.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim() || ''

const findBestTopic = (
  topics: TopicCandidate[],
  names: Array<string | null | undefined>
): TopicCandidate | null => {
  const childTopics = topics.filter((topic) => topic.parent_id)
  const allTopics = [...childTopics, ...topics.filter((topic) => !topic.parent_id)]

  for (const name of names) {
    const normalised = normaliseName(name)
    if (!normalised) continue

    const direct = allTopics.find((topic) =>
      normaliseName(topic.name) === normalised || normaliseName(topic.slug) === normalised
    )
    if (direct) return direct

    const partial = childTopics.find((topic) => {
      const topicName = normaliseName(topic.name)
      return topicName && (normalised.includes(topicName) || topicName.includes(normalised))
    })
    if (partial) return partial
  }

  return null
}

const buildTopicTaxonomy = (topics: TopicCandidate[]) => {
  const parents = topics.filter((topic) => !topic.parent_id)
  return parents
    .map((parent) => {
      const children = topics
        .filter((topic) => topic.parent_id === parent.id)
        .map((child) => '  - ' + child.name + ' [slug: ' + child.slug + ', id: ' + child.id + ']')
        .join('\n')

      return children
        ? '- ' + parent.name + ' [slug: ' + parent.slug + ', id: ' + parent.id + ']\n' + children
        : '- ' + parent.name + ' [slug: ' + parent.slug + ', id: ' + parent.id + ']'
    })
    .join('\n')
}

const contentClusterMap: Record<string, { pillar: string; cluster: string }> = {
  'Physical Security': { pillar: 'Physical Security', cluster: 'physical-security-practice' },
  'Access Control': { pillar: 'Physical Security', cluster: 'access-control-failures' },
  'CCTV & Surveillance': { pillar: 'Physical Security', cluster: 'cctv-real-world-use' },
  'Surveillance Systems': { pillar: 'Physical Security', cluster: 'cctv-real-world-use' },
  'Perimeter Security': { pillar: 'Physical Security', cluster: 'perimeter-security' },
  'Workplace Awareness': { pillar: 'Workplace Awareness', cluster: 'human-behaviour-risk' },
  'Human Behaviour': { pillar: 'Workplace Awareness', cluster: 'predictability-and-routine' },
  'Security Culture': { pillar: 'Workplace Awareness', cluster: 'security-culture-drift' },
  'Digital Threats': { pillar: 'Digital Threats', cluster: 'digital-risk-basics' },
  'Network Security': { pillar: 'Digital Threats', cluster: 'remote-work-network-risk' },
  'Data Protection': { pillar: 'Digital Threats', cluster: 'data-exposure' },
  'Authentication & Passwords': { pillar: 'Digital Threats', cluster: 'authentication-failures' },
  'Public Wi-Fi Risks': { pillar: 'Remote Work Security', cluster: 'public-wifi-risk' },
  'Home Network Security': { pillar: 'Remote Work Security', cluster: 'home-network-risk' },
  'Device Security': { pillar: 'Remote Work Security', cluster: 'device-security' },
  'Social Engineering': { pillar: 'Social Engineering', cluster: 'social-engineering-patterns' },
  'Phishing & Deception': { pillar: 'Social Engineering', cluster: 'phishing-human-factors' },
  'Physical Social Engineering': { pillar: 'Social Engineering', cluster: 'physical-social-engineering' },
  'Incident Response': { pillar: 'Incident Response', cluster: 'incident-response-reality' },
  'Risk Management': { pillar: 'Risk Management', cluster: 'risk-perception' },
}

const toneModes = [
  'neutral operator',
  'direct but measured',
  'client-facing advisory',
  'blunt practical warning',
  'reflective practitioner',
]

const stableHash = (input: string) =>
  Array.from(input).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)


const normaliseClusterText = (input?: string | null) =>
  input
    ?.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'general-security'

const resolveCluster = (category?: string | null, subcategory?: string | null, prompt?: string | null) => {
  const mapped = (subcategory && contentClusterMap[subcategory]) || (category && contentClusterMap[category])
  if (mapped) return mapped

  const fallback = category || subcategory || prompt || 'General Security'
  return {
    pillar: category || 'Security Awareness',
    cluster: normaliseClusterText(fallback),
  }
}

const parseInternalLinks = (value: unknown): InternalLinkTarget[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((link): link is InternalLinkTarget =>
      Boolean(link && typeof link === 'object' && 'slug' in link && 'title' in link && 'anchor' in link)
    )
    .map((link) => ({
      title: String(link.title).slice(0, 120),
      slug: String(link.slug).replace(/^\/+|\/+$/g, ''),
      anchor: String(link.anchor).slice(0, 80),
      reason: link.reason ? String(link.reason).slice(0, 180) : undefined,
    }))
    .filter((link) => link.slug && link.title && link.anchor)
    .slice(0, 4)
}


const articleContainsInternalLinks = (content?: string | null) =>
  Boolean(content && /\[[^\]]+\]\(\/articles\/[^)]+\)/.test(content))

const linkCandidateText = (candidates: Array<{ title: string; slug: string; excerpt?: string | null; content_cluster?: string | null; pillar_topic?: string | null }>) =>
  candidates
    .map((article, index) => {
      const parts = [`${index + 1}. Title: ${article.title}`, `Slug: ${article.slug}`]
      if (article.excerpt) parts.push(`Excerpt: ${article.excerpt}`)
      if (article.content_cluster) parts.push(`Cluster: ${article.content_cluster}`)
      if (article.pillar_topic) parts.push(`Pillar: ${article.pillar_topic}`)
      return parts.join(' | ')
    })
    .join('\n')

const pickFallbackLinkTargets = (
  candidates: Array<{ title: string; slug: string; excerpt?: string | null; content_cluster?: string | null; pillar_topic?: string | null }>,
  draft: Partial<GeneratedArticleDraft>,
  prompt: string
): InternalLinkTarget[] => {
  const haystack = normaliseName([
    prompt,
    draft.title,
    draft.category,
    draft.subcategory,
    draft.content_cluster,
    draft.pillar_topic,
    ...(draft.keyword_suggestions ?? []),
  ].filter(Boolean).join(' '))

  const scored = candidates.map((candidate) => {
    const candidateText = normaliseName([
      candidate.title,
      candidate.excerpt,
      candidate.content_cluster,
      candidate.pillar_topic,
    ].filter(Boolean).join(' '))
    const candidateWords = new Set(candidateText.split(' ').filter((word) => word.length > 3))
    const score = haystack.split(' ').filter((word) => word.length > 3 && candidateWords.has(word)).length
    return { candidate, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0 || scored.length <= 2)
    .slice(0, 2)
    .map(({ candidate }) => ({
      title: cleanInternalLinkTitle(candidate.title),
      slug: candidate.slug.replace(/^\/+|\/+$/g, ''),
      anchor: buildInternalLinkAnchor(candidate.title),
      reason: 'Automatically selected as a related internal article candidate.',
    }))
}

const cleanInternalLinkTitle = (title: string) =>
  String(title || '')
    .replace(/^to\s+/i, '')
    .replace(/^how\s+to\s+to\s+/i, 'How to ')
    .replace(/\s+/g, ' ')
    .trim()

const buildInternalLinkAnchor = (title: string) => {
  const cleaned = cleanInternalLinkTitle(title)
  return cleaned
    .replace(/^(Why|How|What|When|Where)\s+/i, '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim()
    .slice(0, 80) || cleaned.slice(0, 80)
}

const injectMarkdownLinks = (
  content: string,
  targets: InternalLinkTarget[]
) => {
  const usableTargets = targets.slice(0, 2)
  if (!content || content.length < 800 || usableTargets.length === 0 || articleContainsInternalLinks(content)) return content

  const patterns = [
    (anchor: string, slug: string) => `I've seen the same pattern play out in [${anchor}](/articles/${slug}).`,
    (anchor: string, slug: string) => `It's the same kind of failure I discussed regarding [${anchor}](/articles/${slug}).`,
    (anchor: string, slug: string) => `This is why I always point people back to [${anchor}](/articles/${slug}).`,
    (anchor: string, slug: string) => `It reminds me of the gaps we found in [${anchor}](/articles/${slug}).`,
    (anchor: string, slug: string) => `If you want to see how this scales, look at [${anchor}](/articles/${slug}).`,
    (anchor: string, slug: string) => `The logic is identical to what I see with [${anchor}](/articles/${slug}).`,
  ]

  const paragraphs = content.split(/\n\n+/)
  let linkIndex = 0

  const linkedParagraphs = paragraphs.map((paragraph, paragraphIndex) => {
    if (linkIndex >= usableTargets.length) return paragraph

    const trimmed = paragraph.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('- ') || /^\d+\./.test(trimmed)) return paragraph
    if (trimmed.length < 180 || /^(FAQ|Checklist|Quick Checklist)/i.test(trimmed)) return paragraph
    if (paragraphIndex === 0 && paragraphs.length > 3) return paragraph

    const target = usableTargets[linkIndex]
    const slug = target.slug.replace(/^\/+|\/+$/g, '')
    const anchor = target.anchor || buildInternalLinkAnchor(target.title)
    const sentenceParts = paragraph.split(/(?<=[.!?])\s+/)
    const sentenceIndex = sentenceParts.findIndex((sentence) => sentence.length > 90 && !sentence.includes('](/articles/'))
    if (sentenceIndex === -1) return paragraph

    const pattern = patterns[(paragraphIndex + linkIndex) % patterns.length]
    sentenceParts[sentenceIndex] = `${sentenceParts[sentenceIndex]} ${pattern(anchor, slug)}`
    linkIndex += 1
    return sentenceParts.join(' ')
  })

  return linkedParagraphs.join('\n\n')
}


const enforceInternalLinkInjection = (
  draft: GeneratedArticleDraft & { article?: string; internal_links?: InternalLinkTarget[]; internal_link_targets?: InternalLinkTarget[] },
  candidates: Array<{ title: string; slug: string; excerpt?: string | null; content_cluster?: string | null; pillar_topic?: string | null }>,
  prompt: string
) => {
  if (!draft.content || candidates.length === 0) return draft

  const existingLinks = parseInternalLinks(draft.internal_links || draft.internal_link_targets)
  const targets = existingLinks.length > 0
    ? existingLinks.slice(0, 2)
    : pickFallbackLinkTargets(candidates, draft, prompt).slice(0, 2)

  if (!articleContainsInternalLinks(draft.content)) {
    draft.content = injectMarkdownLinks(draft.content, targets)
    draft.article = draft.content
  }

  draft.internal_links = targets
  draft.internal_link_targets = targets
  return draft
}
const jsonError = (message: string, status = 500, details?: unknown) =>
  NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
    },
    { status }
  )

const getErrorMessage = (err: unknown, fallback = 'Article generation failed') => {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err.trim()) return err
  return fallback
}

const buildSystemPrompt = (structureMode: StructureMode) => `You are writing for StaySecure360 as a seasoned security operator and risk professional with real-world experience in physical security, workplace risk, home security, digital security, human behaviour, and organisational failure.

You are not writing as an AI assistant.
You are not writing as a blogger.
You are not writing as a marketer.

You are writing as someone who has seen how security fails in ordinary environments: homes, offices, public spaces, building operations, access points, daily routines, staff shortcuts, and organisations assuming a control is working because it exists on paper.

CORE WRITING INSTRUCTION:

Write a practical, authoritative article on the user supplied topic.

The article should feel like it was written by a real practitioner thinking through the issue, not by a content system filling a template.

The reader should feel that the writer has a point of view.

VOICE:

Use a grounded, direct, practitioner-style voice.

The tone should be:
- professional but not corporate
- direct but not theatrical
- experienced but not arrogant
- slightly opinionated where justified
- practical rather than academic

	HUMAN WRITING RULES:
	
	Do:
	- Vary sentence length naturally and aggressively (mix very short with longer, winding observations)
	- Use some sentence fragments where they feel natural
	- Allow slight roughness in transitions; do not use "Then," "Next," or "Another" to start paragraphs
	- Let some paragraphs end without neatly summarising
	- Occasionally repeat an idea in a different way if it feels natural
	- Include practical observations that feel grounded in real environments
	- Use plain language where possible
	- Challenge weak assumptions or common bad advice
	- Let the article move like a person working through the issue, not like a perfect template
	- Use "I" and "me" to share personal practitioner experiences (e.g., "I've seen...", "I once walked into a site where...")
	- Focus on the "why" of human failure, not just the "what" of security tips
	- Break the flow. If a paragraph is getting too explanatory, cut it off with a blunt observation.

ANTI-STRUCTURE RULE:
Do NOT use section headings (###, ##, #) to organize your article.
The article should flow as a continuous narrative where themes emerge naturally, not as a structured outline.
If you feel the need to add headings, that's a signal the article is too template-like. Rewrite it instead.
Exception: Only use headings if the structure mode explicitly requires them (e.g., "article_with_checklist_and_faq" might use headings for FAQ items, but even then, keep them minimal and conversational).
The reader should discover the structure through reading, not through headings.

	Do not:
	- Do not use a rigid blog structure
	- Do not use numbered "Scenario 1 / Scenario 2" sections
	- Do not use "Case Study" labels unless the user specifically asks for formal case studies
	- Do not over-explain obvious points
	- Do not sound like a textbook
	- Do not sound like a corporate safety brochure
	- Do not make every paragraph perfectly balanced
	- Do not make every transition smooth
	- Do not use polished slogan-style lines
	- Do not write like you are trying to impress the reader
	- Do not overuse rhetorical phrases like "the truth is" or "here's the thing"
	- Do not overuse em dashes, semicolons, three-part patterns, or neatly mirrored sentences
	- Do not use "Consider," "Ensure," or "Address" as commands to the reader
	- Do not summarize the article in the final paragraph
	- Do not use lists or "key takeaways" inside the article body
	- Do not use transition words like "Furthermore," "Moreover," "Additionally," or "In addition"

BANNED PHRASES:

Do not use any of the following phrases or close variants of them. These are the most commonly flagged AI-generated expressions and will make the article sound machine-written:

- "In today's world"
- "It is important to note"
- "In conclusion"
- "According to experts"
- "Organisations must ensure"
- "Now more than ever"
- "A comprehensive approach"
- "This article explores"
- "Delve into"
- "Robust security posture"
- "Peace of mind"
- "The key takeaway"
- "When it comes to"
- "Security is everyone's responsibility"
- "Provide a valuable insight"
- "Left an indelible mark"
- "A stark reminder"
- "A nuanced understanding"
- "The complex interplay"
- "An unwavering commitment"
- "Underscore the importance"
- "Play a pivotal role"
- "A pivotal moment"
	- "Navigate the complex"
	- "Mark a turning point"
	- "Gain a deeper understanding"
	- "The transformative power"
	- "A multi-faceted approach"
	- "Highlight the potential"
	- "Pave the way for"
	- "It is crucial to"
	- "Consider"
	- "Address these"
	- "After all"
	- "Remember"
	- "One common error"
	- "Then there's"
	- "Another glaring mistake"
	- "Let's not forget"
	- "In security"
	- "Widespread oversight"
	- "Deter potential intruders"
	- "The final mistake"
	- "Culture of security awareness"
	- "Foster a culture"
	- "Proactive, vigilant, and willing to adapt"
	- "It's not just about"
	- "The reality is"
	- "When it comes to"
	- "Crucial to consider"
	- "Make a change"
	- "Room for improvement"
	- "Stay vigilant"
	- "Invitation to disaster"
	- "The greatest point of entry"
	- "Outdated practices"
	- "Alternative storage solutions"
	- "Widespread oversight"
	- "Functions flawlessly"
	- "False security blankets"
	- "Turn their security systems into"
	- "Overlook simple but critical mistakes"

ANECDOTE AND EXAMPLE RULES:

Use examples carefully.

Do not invent highly specific factual incidents, street names, dates, companies, suburbs, case numbers, police outcomes, exact dollar losses, or named people unless provided by the user.

Instead, use realistic composite examples based on common security patterns.

Avoid overused examples unless you add a specific practical angle.

Avoid defaulting to:
- spare key under the mat
- holiday photos on social media
- generic doorbell camera advice
- "nice suburban house"
- "family went away on vacation"
- "someone clicked a phishing email" without a more useful operational detail

If using a scenario, weave it naturally into the article rather than introducing it as a case study.

STRUCTURE RULES:

Do not output metadata inside the public article body.

The visible article body must include only what a reader should see on the website.

The visible article can include:
- article body
- a practical closing section only if it fits naturally
- a checklist only when useful
- a FAQ only when useful

A checklist or FAQ is optional.
Do not always include both a checklist and FAQ.
Vary the article structure naturally.

Current structure mode for this generation: ${structureMode}

Interpret that mode as follows:
- article_only: do not include a checklist or FAQ inside the article body
- article_with_short_checklist: include a short practical checklist, but no FAQ
- article_with_short_faq: include a short FAQ, but no checklist
- article_with_checklist_and_faq: include both, but keep them short and useful

CHECKLIST FORMATTING RULES (if structure mode requires it):
If you include a checklist, it MUST be:
- Written as flowing prose paragraphs, NOT as bullet points
- Uneven in length (some items 1-2 sentences, others 3-4)
- Conversational in tone, not instructional
- Embedded naturally within the article flow, not in a separate section
DO NOT use:
- Bolded headers with colons (e.g., "**Check Locks**: Regularly test...")
- Parallel structure or balanced formatting
- Numbered lists
- Separate "Checklist" or "Practical Steps" sections
INSTEAD, weave items into the narrative:
"Start with the basics. Test your locks. Actually turn the key. See if it catches. Most people don't. Then think about your cameras—are you actually watching them? Or are they just there, collecting dust?"
This should read like a practitioner thinking through the issue, not a training guide.

If a FAQ is included:
- Keep it short
- Use only genuinely useful questions
- Do not include filler questions
- Format questions naturally without excessive formatting
- Answers should be conversational, not robotic

	CRITICAL WORD COUNT REQUIREMENT:
	
	The article body should aim for a minimum of 1000 words. This is important for depth and SEO.
	If you reach 800 words and the article feels complete, you MUST continue by:
- Adding a real-world scenario or case study that illustrates the failure pattern
- Exploring the psychological or organisational reasons why people miss this risk
- Discussing where technology helps AND where it creates false confidence
- Adding practical nuances that only someone with real experience would know
Do not pad with filler. Every additional word should add substance.
	Count the words in your final article and verify it meets 1000+ before responding.
	If the article is under 1000 words, rewrite it to expand the depth, not the length.

CONTENT DEPTH:

The article should explain:
- what usually goes wrong
- why people miss the risk
- how ordinary behaviour creates exposure
- what practical steps reduce that exposure
- where technology helps
- where technology creates false confidence

Do not just give tips.
Explain the failure pattern behind the tips.

STYLE IMPERFECTION LAYER:

Write with natural readability, not grammatical perfection.

Use occasional:
- shorter abrupt sentences
- uneven paragraph lengths
- direct statements
- mild repetition
- conversational turns

But do not add fake typos.
Do not make the writing look careless.

ANTI-EXPLAINER OVERRIDE:

If the article starts to sound like a clean explanation, guide, training note, or topic breakdown, rewrite it from a real-world observation instead.

Avoid phrases such as:
- "Let's break this down"
- "There are several reasons"
- "Another common issue"
- "A significant issue"
- "In many cases"
- "So, what can you do"
- "Ultimately"

OPENING RULE:

Start with a specific, ordinary real-world moment involving the topic. Do not start with a general statement about why the topic is important.

OPENING EXAMPLES:
❌ BAD (Generic):
"Home security is a critical concern for many homeowners today. With break-ins on the rise, it's important to ensure your property is properly protected."

✅ GOOD (Specific, real-world):
"It's a quiet evening, and you settle into your armchair, satisfied that your home security system is up to par. You've got the locks, alarms, and maybe even a camera or two. Feels secure, right? But what's the reality?"

The good example:
- Places the reader in a specific moment
- Uses sensory details (quiet evening, armchair)
- Ends with a question that creates tension
- Doesn't start with abstract importance

CHECKLIST EXAMPLES:
❌ BAD (Polished, templated):
- **Check Locks**: Regularly test all your locks and windows to ensure they function properly.
- **Limit Technology Reliance**: Use security technology as a tool, not a crutch.
- **Be Cautious**: Be mindful of who you let know your personal information.

✅ GOOD (Informal, woven into narrative):
"Start with the basics. Test your locks. Actually turn the key. See if it catches. Most people don't. Then think about your cameras—are you actually watching them? Or are they just there? And don't talk about your vacation plans with the wrong people. One misplaced comment can invite unwanted attention."

The good example:
- Written as prose, not bullet points
- Conversational tone
- Uneven length
- Woven into the narrative flow
- Feels like practitioner thinking, not training guide

ANTI-POLISH RULE:

Avoid sentences that sound like slogans, neat conclusions, or advice headlines. If a sentence sounds quote-worthy, make it plainer and more casual.

ENDING EXAMPLES:
❌ BAD (Polished conclusion):
"In conclusion, home security requires a multi-faceted approach combining technology, human vigilance, and community awareness. By implementing these strategies, you can significantly reduce your risk of break-ins and ensure peace of mind."

✅ GOOD (Natural stopping point):
"The moment you think your system is complete is the moment it starts to fail. That's when the gaps open up."

The good example:
- Ends mid-thought, not with a summary
- Leaves the reader with an observation, not a lesson
- Feels like the writer stopped, not finished
- Creates slight tension rather than closure

ENDING RULE:

Do NOT end with:
- A summary or recap
- A call-to-action
- A polished takeaway or lesson
- A neat conclusion that ties everything together
- A dramatic statement designed to be memorable

Instead, end at a natural stopping point where the thought naturally concludes. This might be:
	- Mid-observation: "That's when most people miss it."
	- A practical detail: "The moment you think your system is complete is the moment it starts to fail."
	- An unresolved tension: "But most people never get there."
	
	The ending should feel like the writer stopped writing, not like they finished writing.
	DO NOT end with a summary of the article's main points.
	DO NOT use "Remember," "After all," or "In conclusion" in the final paragraph.
	DO NOT try to leave the reader with a "positive" or "encouraging" takeaway. Security is often messy and unresolved; let the ending reflect that.

SEO AND OUTPUT RULES:

Return ONLY valid JSON with exactly these keys:
{
  "title": "string",
  "article": "string",
  "content": "string",
  "excerpt": "string",
  "slug": "string",
  "meta_title": "string",
  "meta_description": "string",
  "image_prompt": "string",
  "category": "string",
  "subcategory": "string",
  "topic_id": "string or null",
  "includeChecklist": true,
  "includeFAQ": false,
  "key_takeaways": ["string", "string", "string"],
  "checklist_items": ["string", "string", "string"],
  "faq_items": [
    {"question": "string", "answer": "string"}
  ],
  "suggested_topic": "string",
  "keyword_suggestions": ["string", "string", "string", "string", "string"],
  "content_cluster": "string",
  "pillar_topic": "string",
  "internal_links": [
    {"title": "Existing related article title", "slug": "existing-related-article-slug", "anchor": "natural anchor text", "reason": "why this should be linked"}
  ],
  "ai_structure_mode": "string"
}

The article and content fields must contain the same visible article body in Markdown.

The excerpt, slug, meta_title, meta_description, image_prompt, category, subcategory, topic_id, includeChecklist, includeFAQ, key_takeaways, checklist_items, faq_items, suggested_topic, keyword_suggestions, content_cluster, pillar_topic, internal_links, and ai_structure_mode fields are for the CMS only and must not be repeated as labelled metadata inside the article/content body.

Do not place "Excerpt", "Slug", "Image Prompt", "Meta Title", "Meta Description", "Keyword Suggestions", "Category", or "Subcategory" headings inside the article/content field.

Slug must be URL-safe.
Meta title should be under 60 characters.
Meta description should be under 160 characters.
Excerpt should be under 160 characters.

IMAGE PROMPT RULE:

The image prompt should describe a realistic, cinematic, security-related image.
No text in image.
No logos.
No exaggerated crime scene.
No dramatic masked burglar unless the topic specifically requires it.
No cartoon style.
No obvious stock-photo feel.
Keep it grounded and believable.

TAXONOMY RULES:

Use the supplied available taxonomy to choose the best child topic/subcategory for this article.
Prefer child topics over parent topics.
Return the selected topic id in topic_id exactly as supplied.
Return category as the parent topic name and subcategory as the selected child topic name where possible.
If no child topic fits, use the closest parent topic id.
Do not invent category or subcategory names outside the supplied taxonomy unless none are relevant.

CONTENT ENGINE RULES:

Use the supplied existing-article candidates only for internal_links. Do not invent slugs. If no existing article is a genuinely good fit, return an empty internal_links array.

Choose a content_cluster that is short, lowercase, and hyphenated. It should group related articles into an SEO silo, for example: access-control-failures, cctv-real-world-use, phishing-human-factors, physical-social-engineering, security-culture-drift.

Choose a pillar_topic that describes the larger authority hub, for example Physical Security, Workplace Awareness, Digital Threats, Social Engineering, Incident Response, or Risk Management.

Internal links should feel editorial, not forced. Prefer 1-3 high-relevance links over a long list.

AUTOMATIC INTERNAL LINK INJECTION RULES:

You must handle internal linking automatically. The user should not need to ask for links in the prompt.

When relevant existing article candidates are supplied:
- Choose 1-3 of the most relevant candidates only.
- For every item you include in internal_links, the article/content body must also contain a natural Markdown link to that article.
- Use this exact link format: [natural anchor text](/articles/existing-article-slug)
- Place links inside ordinary paragraphs where they genuinely support the point being made.
- Do not output a separate "Related Articles", "Further Reading", or "Internal Links" section inside the article body.
- Do not group links together.
- Do not use generic anchor text such as "click here", "read more", or the full article title unless it sounds natural.
- If no candidate fits naturally, return internal_links as [] and do not force a link.

The visible article should read as a normal article. The internal links should be nearly invisible editorial support, not SEO stuffing.

Set ai_structure_mode to the current structure mode.`

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
  })

  // ── Auth check ──────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse request ────────────────────────────────────────────
  let body: GenerateArticleRequest & { generateImage?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { prompt, audience, tone, topic, keywords } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const hashInput = `${prompt}|${audience ?? ''}|${tone ?? ''}|${topic ?? ''}|${keywords ?? ''}`
  const hash = stableHash(hashInput)
  const structureMode = structureModes[hash % structureModes.length]
  const fallbackToneMode = toneModes[Math.floor(hash / 7) % toneModes.length]
  const appliedTone = tone?.trim() || fallbackToneMode
  const requestedCluster = resolveCluster(topic, undefined, prompt)

  const { data: availableTopics } = await adminClient
    .from('topics')
    .select('id, name, slug, parent_id')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const taxonomy = buildTopicTaxonomy((availableTopics ?? []) as TopicCandidate[])

  const { data: existingArticles } = await adminClient
    .from('articles')
    .select('title, slug, excerpt, content_cluster, pillar_topic')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(8)

  const linkCandidates = (existingArticles ?? [])
    .filter((article) => article.title && article.slug)
    .map((article) => ({
      title: String(article.title),
      slug: String(article.slug).replace(/^\/+|\/+$/g, ''),
      excerpt: article.excerpt ? String(article.excerpt) : null,
      content_cluster: article.content_cluster ? String(article.content_cluster) : null,
      pillar_topic: article.pillar_topic ? String(article.pillar_topic) : null,
    }))

  const systemPrompt = buildSystemPrompt(structureMode)

  const userPrompt = [
    `TOPIC: ${prompt}`,
    audience ? `TARGET AUDIENCE: ${audience}` : '',
    `TONE MODE: ${appliedTone}`,
    topic ? `OPTIONAL USER CATEGORY GUIDANCE: ${topic}` : '',
    taxonomy ? `AVAILABLE TAXONOMY (choose the best topic_id from this list):\n${taxonomy}` : '',
    `RECOMMENDED PILLAR TOPIC: ${requestedCluster.pillar}`,
    `RECOMMENDED CONTENT CLUSTER: ${requestedCluster.cluster}`,
    keywords ? `TARGET KEYWORDS: ${keywords}` : '',
    linkCandidates.length ? `EXISTING ARTICLE CANDIDATES FOR INTERNAL LINKS (use only these slugs if relevant): ${JSON.stringify(linkCandidates)}` : 'EXISTING ARTICLE CANDIDATES FOR INTERNAL LINKS: []',
    `STRUCTURE MODE: ${structureMode}`,
    'Write the article now. Keep CMS metadata separate from the visible article/content body.',
  ]
    .filter(Boolean)
    .join('\n')

  let draft: (GeneratedArticleDraft & {
    article?: string
    image_prompt?: string
    category?: string
    subcategory?: string
    includeChecklist?: boolean
    includeFAQ?: boolean
    topic_id?: string | null
    internal_links?: InternalLinkTarget[]
    internal_link_targets?: InternalLinkTarget[]
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.88, // Slightly lower for faster, more consistent generation
      max_tokens: 2800, // Sufficient for 1200+ words while reducing latency
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 })
    }

    try {
      draft = JSON.parse(rawContent)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    draft.content = draft.content || draft.article || ''
    draft.article = draft.article || draft.content

    if (!draft.slug) {
      draft.slug = generateSlug(draft.title)
    }

    if (!draft.meta_title) {
      draft.meta_title = draft.title?.slice(0, 60) ?? ''
    }

    if (!draft.excerpt && draft.content) {
      draft.excerpt = draft.content.replace(/[#*_`>\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
    }

    if (!draft.meta_description) {
      draft.meta_description = draft.excerpt?.slice(0, 160) ?? ''
    }

    const topicCandidates = (availableTopics ?? []) as TopicCandidate[]
    const matchedTopic =
      topicCandidates.find((candidate) => candidate.id === draft.topic_id) ||
      findBestTopic(topicCandidates, [draft.subcategory, draft.suggested_topic, draft.category, topic, prompt])

    if (matchedTopic) {
      const parent = topicCandidates.find((candidate) => candidate.id === matchedTopic.parent_id)
      draft.topic_id = matchedTopic.id
      draft.subcategory = matchedTopic.parent_id ? matchedTopic.name : (draft.subcategory || matchedTopic.name)
      draft.category = parent?.name || draft.category || matchedTopic.name
    }

    const clusterFromDraft = resolveCluster(draft.category || topic, draft.subcategory, prompt)
    draft.content_cluster = normaliseClusterText(draft.content_cluster || clusterFromDraft.cluster)
    draft.pillar_topic = draft.pillar_topic || clusterFromDraft.pillar
    draft.ai_structure_mode = structureMode
    const parsedLinks = parseInternalLinks(draft.internal_links || draft.internal_link_targets)
    draft.internal_links = parsedLinks
    draft.internal_link_targets = parsedLinks

    draft = enforceInternalLinkInjection(draft, linkCandidates, prompt)

    // POST-GENERATION VALIDATION
    // Validate article quality and log issues for monitoring
    const validation = validateArticle(draft.content || '', 1000)
    console.log(generateValidationReport(validation))
    
    // Log token estimate
    const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4) + 500
    if (estimatedTokens > 3000) {
      console.warn(`[Token Budget] Prompt may exceed limits: ~${estimatedTokens} tokens`)
    }

    if (Array.isArray(draft.keyword_suggestions)) {
      draft.keyword_suggestions = draft.keyword_suggestions
        .map((keyword) => String(keyword).trim())
        .filter(Boolean)
        .slice(0, 8)
    } else {
      draft.keyword_suggestions = []
    }
  } catch (err: unknown) {
    console.error('OpenAI text generation error:', err)
    const message = err instanceof Error ? err.message : 'OpenAI API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

    return NextResponse.json({ draft }, { status: 200 })
  } catch (err: unknown) {
    console.error('/api/generate-article fatal error:', err)
    return jsonError(getErrorMessage(err), 500, err)
  }
}

// Handle prefetch requests (GET) by returning a 405 with proper headers
// This prevents browser prefetch errors from appearing in logs
export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Use POST to generate articles.' },
    { 
      status: 405,
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json',
      }
    }
  )
}

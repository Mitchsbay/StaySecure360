# StaySecure360 Article Generator Prompt — Pillar Pages + Automatic Internal Linking

This is the live prompt pattern used by `/app/api/generate-article/route.ts`.

The generator now produces two layers:

1. **Visible article body** — what the reader sees.
2. **CMS metadata** — excerpt, slug, image prompt, SEO fields, keywords, content cluster, pillar topic, selected topic/subcategory, and internal link targets.

The metadata is returned as JSON and should not be pasted into the public article body.

## Core prompt behaviour

The model writes as a grounded security operator and risk professional, not as a marketer, blogger, or generic AI assistant. It avoids rigid structure, polished slogans, fake specificity, and overused AI/corporate phrases.

## System-level controls added automatically

The API adds these controls without the user needing to prompt for them:

- Rotating article structure mode:
  - article only
  - article with short checklist
  - article with short FAQ
  - article with checklist and FAQ
- Rotating tone mode if none is selected:
  - neutral operator
  - direct but measured
  - client-facing advisory
  - blunt practical warning
  - reflective practitioner
- Live topic taxonomy from Supabase
- Best-fit child subtopic selection
- Recommended pillar topic
- Recommended content cluster
- Existing published article candidates for internal linking
- Automatic natural internal-link insertion into the article body when suitable candidates exist

## Automatic internal linking rule

The user does not need to ask for internal links. The API automatically supplies published article candidates and instructs the model to:

- choose 1–3 genuinely relevant candidates only
- place links inside normal article paragraphs
- use Markdown links in this format: `[natural anchor text](/articles/existing-article-slug)`
- avoid a separate "Related Articles" or "Further Reading" section inside the article body
- avoid generic anchor text such as "click here" or "read more"
- return an empty internal_links array if nothing fits naturally

The article page still shows related articles separately, but contextual links are now inserted into the article content itself during generation.

## Pillar pages

Public topic pages now act as pillar hubs:

- Parent topics such as Physical Security, Digital Threats, Social Engineering, Remote Work Security, and Workplace Awareness become pillar pages.
- Pillar pages show child subtopics and articles from those child topics.
- Child topic pages still work as focused subtopic pages.
- The `/topics` page lists parent pillar hubs only, with article counts including child-topic articles.

## Required JSON output

```json
{
  "title": "",
  "article": "",
  "content": "",
  "excerpt": "",
  "slug": "",
  "meta_title": "",
  "meta_description": "",
  "image_prompt": "",
  "category": "",
  "subcategory": "",
  "topic_id": "",
  "includeChecklist": true,
  "includeFAQ": false,
  "key_takeaways": [],
  "checklist_items": [],
  "faq_items": [],
  "suggested_topic": "",
  "keyword_suggestions": [],
  "content_cluster": "",
  "pillar_topic": "",
  "internal_links": [],
  "ai_structure_mode": ""
}
```

## Deployment note

Run the Phase 2 Supabase SQL before saving generated drafts so the article metadata fields exist.

## Backend hardening added

The API now performs a second internal-link injection pass after the main article is generated. If the article body does not already contain contextual `/articles/...` Markdown links, the backend sends the draft and the existing published article candidates through a focused editor pass that only inserts 1–3 natural internal links.

This means the user does not need to add linking instructions manually. The generator fetches published articles, supplies them to the model, validates that links were inserted, and stores the selected link targets in CMS metadata.

Additional anti-generic controls were also added:

- start from a real-world observation, not a generic topic introduction
- avoid explainer phrases such as "Let's break this down" and "Another common issue"
- avoid polished slogans and neat conclusions
- avoid checklist-style output unless the structure mode genuinely calls for it

## Enhanced Improvements (Phase 1 & 2)

### Word Count Enforcement

The article body MUST be a minimum of 1200 words. This is non-negotiable. The backend validates word count and will trigger expansion if needed. If you reach 1000 words and the article feels complete, you MUST continue by:
- Adding a real-world scenario or case study that illustrates the failure pattern
- Exploring the psychological or organisational reasons why people miss this risk
- Discussing where technology helps AND where it creates false confidence
- Adding practical nuances that only someone with real experience would know

Do not pad with filler. Every additional word should add substance.

### Checklist Formatting Rules (if structure mode requires it)

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

### Anti-Structure Rule

Do NOT use section headings (###, ##, #) to organize your article. The article should flow as a continuous narrative where themes emerge naturally, not as a structured outline.

If you feel the need to add headings, that's a signal the article is too template-like. Rewrite it instead.

Exception: Only use headings if the structure mode explicitly requires them (e.g., "article_with_checklist_and_faq" might use headings for FAQ items, but even then, keep them minimal and conversational).

The reader should discover the structure through reading, not through headings.

### Ending Rule

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

### Opening Examples

❌ BAD (Generic):
"Home security is a critical concern for many homeowners today. With break-ins on the rise, it's important to ensure your property is properly protected."

✅ GOOD (Specific, real-world):
"It's a quiet evening, and you settle into your armchair, satisfied that your home security system is up to par. You've got the locks, alarms, and maybe even a camera or two. Feels secure, right? But what's the reality?"

The good example:
- Places the reader in a specific moment
- Uses sensory details (quiet evening, armchair)
- Ends with a question that creates tension
- Doesn't start with abstract importance

### Checklist Examples

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

### Ending Examples

❌ BAD (Polished conclusion):
"In conclusion, home security requires a multi-faceted approach combining technology, human vigilance, and community awareness. By implementing these strategies, you can significantly reduce your risk of break-ins and ensure peace of mind."

✅ GOOD (Natural stopping point):
"The moment you think your system is complete is the moment it starts to fail. That's when the gaps open up."

The good example:
- Ends mid-thought, not with a summary
- Leaves the reader with an observation, not a lesson
- Feels like the writer stopped, not finished
- Creates slight tension rather than closure

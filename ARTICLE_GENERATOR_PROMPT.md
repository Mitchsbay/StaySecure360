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
- avoid a separate “Related Articles” or “Further Reading” section inside the article body
- avoid generic anchor text such as “click here” or “read more”
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
- avoid explainer phrases such as “Let’s break this down” and “Another common issue”
- avoid polished slogans and neat conclusions
- avoid checklist-style output unless the structure mode genuinely calls for it

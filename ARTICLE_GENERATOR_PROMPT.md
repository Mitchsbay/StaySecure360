# StaySecure360 Article Generator Prompt — Content Engine Phase 2

This is the live prompt pattern used by `/app/api/generate-article/route.ts`.

The generator now produces two layers:

1. **Visible article body** — what the reader sees.
2. **CMS metadata** — excerpt, slug, image prompt, SEO fields, keywords, content cluster, pillar topic, and internal link targets.

The metadata is returned as JSON and should not be pasted into the public article body.

## Core prompt behaviour

The model writes as a grounded security operator and risk professional, not as a marketer, blogger, or generic AI assistant. It avoids rigid structure, polished slogans, fake specificity, and overused AI/corporate phrases.

## System-level controls

The API adds these controls automatically:

- Rotating structure mode:
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
- Recommended pillar topic
- Recommended content cluster
- Existing published article candidates for internal linking

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

## Internal linking rule

Internal links must only use slugs supplied by the API from existing published articles. The model should not invent slugs.

## Deployment note

Run `supabase/content-engine-phase-2.sql` in Supabase after deploying this repo so the new CMS fields exist before saving generated drafts.

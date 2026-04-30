# StaySecure360 Article Generator Prompt — Operational Humanised Voice

This is the live prompt pattern used by `/app/api/generate-article/route.ts`.

The generator now produces two layers:

1. **Visible article body** — what the reader sees.
2. **CMS metadata** — excerpt, slug, image prompt, SEO fields, keywords, content cluster, pillar topic, selected topic/subcategory, and internal link targets.

The metadata is returned as JSON and should not be pasted into the public article body.

## Core prompt behaviour

The model writes as an experienced security operator and risk professional, not as a marketer, blogger, generic AI assistant, or grumpy character. The intended voice is:

- practical
- factual
- field-informed
- direct
- operationally realistic
- calm rather than theatrical

The system no longer pushes a "grizzled rant" style. That was producing exaggerated lines such as "Hollywood break-ins", "brutal truth", "battlefield", "frontier", and similar fake-grit phrasing.

## Major changes in this version

### 1. Narrative article body by default

The generator now uses `article_only` as the default structure mode.

Checklist and FAQ fields can still be returned as CMS metadata, but they should not be forced into the visible article body unless specifically requested. This avoids the article reading like a templated SEO post.

### 2. Shorter, tighter article target

The generator now aims for **850–1100 words** unless the user asks for a longer article.

The previous 1000–1200+ word target encouraged padding and caused the model to list too many examples. Shorter articles are more likely to feel authored, focused, and human.

### 3. Fewer examples, more depth

The generator is instructed to choose **3–4 developed examples at most**. It should explain the mechanics of each failure properly instead of trying to cover every related issue.

Good example depth:

- a strike plate fitted with short screws
- a rear gate that does not latch
- a sliding door that lifts from the track
- CCTV pointing at the driveway while missing the side access
- alarm notifications going to an ignored inbox

Poor example behaviour:

- listing doors, windows, gates, lighting, cameras, alarms, shrubs, dogs, ladders, neighbours, cleaners, and smart-home gadgets in one article

### 4. Internal links are metadata first

The backend no longer forcibly injects contextual `/articles/...` links into the article body.

The previous automatic link injection created unnatural lines such as:

- "It's worth looking at..."
- "For a broader look at this..."
- "I often reference..."
- "The failure mode here is remarkably similar..."

These made the articles look AI-generated and interrupted otherwise natural paragraphs.

The API still returns `internal_links` metadata so the site can display related reading separately, and an editor can manually add a contextual link when it genuinely fits.

### 5. Operational realism over grumpiness

The system prompt now bans theatrical or fake-grit phrasing such as:

- "Hollywood break-ins"
- "lasers"
- "battlefield"
- "frontier"
- "brutal truth"
- "wake-up call"
- "not good"
- "no gadget replaces grit"
- "enough with the excuses"
- "security isn't sexy"
- "bad guys"
- "movie villains"
- "fortress"
- "lazy thieves"

The preferred style is measured and experienced, for example:

> The first thing I usually check on a residential job is not the alarm panel. It is the side gate.

That kind of opening is specific without becoming theatrical.

## System-level controls now added automatically

The API adds these controls without the user needing to prompt for them:

- Operational article body by default
- Live topic taxonomy from Supabase
- Best-fit child subtopic selection
- Recommended pillar topic
- Recommended content cluster
- Existing published article candidates for internal-link metadata
- Quality validation for AI/corporate phrases and theatrical fake-grit phrasing

## Internal linking rule

The user does not need to ask for related links. The API automatically supplies published article candidates and instructs the model to return suitable targets in the `internal_links` metadata field.

The visible article body should not have internal links forced into paragraphs. Contextual links should only appear when they are genuinely natural.

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
  "includeChecklist": false,
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

## Writing rules now used by the API

- Start from a specific operational observation, not a generic introduction.
- Do not use Markdown headings in the article body.
- Do not use numbered sections or bullet lists in the article body.
- Do not write a neat checklist unless explicitly requested.
- Do not include a forced FAQ inside the article body.
- Do not use fake anecdotes that sound dramatic or invented.
- Do not cover every possible issue.
- Use 3–4 developed examples at most.
- Prefer factual mechanics over attitude.
- End with a practical warning or grounded observation, not a polished conclusion.

## Technical accuracy reminders

- Avoid questionable claims about specialist attack tools unless the topic specifically requires them.
- Do not mention RFID jammers, hacking gadgets, or sophisticated bypass methods in ordinary residential articles unless technically accurate and relevant.
- If discussing a credit-card bypass, make clear it applies to loose spring latches or poor handle locks, not a properly thrown deadbolt.
- If discussing deadbolts, distinguish between the lock body, strike plate, frame, screw length, and door alignment.
- If discussing alarms and CCTV, focus on realistic failures such as dead backup batteries, disabled notifications, full storage, poor camera angles, dirty lenses, app access problems, and nobody checking the system.

## Deployment note

Replace `/app/api/generate-article/route.ts` and `/lib/article-validation.ts` with this version before deploying.

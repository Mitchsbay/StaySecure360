# StaySecure360 V6.6 — Admin Article Quality Score

This update adds a lightweight article quality score to the AI article generator admin screen.

## What changed

- The `/api/generate-article` route now calculates a final quality score after all backend rewrites, cleanup passes, Australian spelling normalisation, technical wording cleanup, and natural internal-link insertion.
- The generated draft now includes a `quality_score` object.
- The admin generator UI displays the score immediately after generation.

## What the score checks

The score uses the existing `lib/article-validation.ts` checks and summarises them for the editor:

- overall score out of 100
- publish-ready / minor edit recommended / rewrite recommended status
- word count
- AI-style or fake-grit phrase warnings
- report/checklist structure warnings
- internal-link quality warnings
- ending/conclusion warnings
- recommended editorial action

## Notes

This is a V1 admin quality panel only. It does not add new database columns or require a Supabase migration. The score is intended to help decide whether to save, edit, or regenerate an article draft before publishing.

# Generate Article 504 Timeout Fix

This update reduces the chance of `/api/generate-article` timing out on Vercel.

## What changed

- Removed the second OpenAI call that was previously used to inject internal links.
- Added deterministic server-side internal link injection after the first article generation pass.
- Reduced article generation token budget from 4000 to 2600.
- Kept internal links automatic: the backend still pulls published article candidates and inserts 1-3 contextual links where possible.

## Important

Internal links only appear when there are existing articles with `status = published` in Supabase.

If there are no published articles, the generator will still create the article, but it will not inject links because there is nothing safe to link to.

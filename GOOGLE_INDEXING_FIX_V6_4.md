# StaySecure360 V6.4 — Google Sitemap, Search Console and Analytics Fix

This update adds a more WordPress-plugin-like SEO foundation for Google discovery and monitoring.

## What changed

### 1. Sitemap index

`/sitemap.xml` is now a sitemap index that points Google to smaller, dedicated sitemaps:

- `/page-sitemap.xml` — static public pages
- `/article-sitemap.xml` — published article pages from Supabase
- `/topic-sitemap.xml` — topic pages from Supabase

This makes Search Console easier to diagnose because article crawling is separated from static pages.

### 2. Robust XML route handlers

The old Next metadata sitemap was replaced with explicit XML route handlers. These return valid XML with the correct `application/xml` content type and cache headers.

This is intended to reduce Google Search Console `Couldn't fetch` issues caused by sitemap timeouts, dynamic data errors, or unclear sitemap output.

### 3. Lightweight Supabase sitemap queries

The article sitemap no longer loads full article content or topic joins. It only requests:

- `slug`
- `updated_at`
- `published_at`
- `created_at`

This is faster and less likely to fail when Googlebot requests the sitemap.

### 4. Google Analytics page-view tracking

The existing GA component was improved for the Next.js App Router. It now sends page views when the route changes, not only on the first page load.

Set this in Vercel:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. Google Search Console HTML tag verification

You can now verify the site using a Search Console HTML meta tag token.

Set this in Vercel:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-site-verification-token
```

Paste only the token inside the `content="..."` value, not the full meta tag.

## Required Vercel environment variables

Make sure these are set in Vercel for Production:

```env
NEXT_PUBLIC_SITE_URL=https://www.staysecure360.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-site-verification-token
```

The `NEXT_PUBLIC_SITE_URL` value must match the canonical version of the site you use in Search Console. Do not mix `https://staysecure360.com` and `https://www.staysecure360.com` unless one redirects cleanly to the other.

## After deployment

Open these URLs in a browser:

- `https://www.staysecure360.com/sitemap.xml`
- `https://www.staysecure360.com/page-sitemap.xml`
- `https://www.staysecure360.com/article-sitemap.xml`
- `https://www.staysecure360.com/topic-sitemap.xml`
- `https://www.staysecure360.com/robots.txt`

The article sitemap should list `/articles/...` URLs. If it does not, check:

1. Articles are marked `published` in Supabase.
2. Article slugs are populated.
3. Supabase public read/RLS policy allows published articles to be queried.
4. Vercel has the correct Supabase environment variables.

## Search Console steps

1. Submit only this sitemap first:

```text
https://www.staysecure360.com/sitemap.xml
```

2. If Google still reports `Couldn't fetch`, test the direct sitemap URLs above.
3. Use URL Inspection on one article URL and click **Request indexing** after the article page loads successfully.
4. Re-check Search Console after Google has had time to crawl the updated sitemap.

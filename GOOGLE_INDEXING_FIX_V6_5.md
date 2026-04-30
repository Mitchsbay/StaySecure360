# StaySecure360 V6.5 — Google Indexing and Resource Fetch Hardening

This update is focused on Google Search Console issues rather than article-writing voice.

## Problems addressed

Google Search Console reported:

- `Duplicate without user-selected canonical`
- `Page with redirect`
- failed resource loads for `/_next/image?...`
- failed resource loads for some `/_next/static/...` scripts and CSS

## What changed

### 1. Canonical host normalisation

`getSiteUrl()` now normalises the site to:

```text
https://www.staysecure360.com
```

If `NEXT_PUBLIC_SITE_URL` is accidentally set to `https://staysecure360.com`, canonical URLs, sitemap URLs, OpenGraph URLs and robots sitemap URLs are still forced back to the `www` host.

### 2. Non-www redirect

`next.config.js` now redirects:

```text
https://staysecure360.com/:path*
```

to:

```text
https://www.staysecure360.com/:path*
```

This helps Google consolidate duplicate host versions.

### 3. Root-level article slug redirect

A new dynamic route was added:

```text
app/[slug]/page.tsx
```

If an old/root-level URL like:

```text
https://www.staysecure360.com/example-article-slug
```

matches a published article, it permanently redirects to:

```text
https://www.staysecure360.com/articles/example-article-slug
```

If it is not a known article slug, it returns 404.

### 4. Plain `<img>` for remote article images

The public article hero image, article cards, and YouTube thumbnails no longer use Next.js image optimisation for remote images.

This avoids Google needing to fetch images through URLs like:

```text
/_next/image?url=https%3A%2F%2Fimg.youtube.com%2F...
```

Instead, Google can fetch the original remote image URL directly from the page markup.

### 5. Robots asset allowance

`robots.ts` now explicitly allows:

```text
/_next/static/
/_next/image
```

The middleware already only applies to `/admin` and `/login`, so public pages and Next static assets are not intercepted.

### 6. Static asset cache headers

`/_next/static/*` remains immutable. `/_next/image` receives a shorter cache header. The site no longer depends on `/_next/image` for public article imagery, but it remains crawlable and cacheable if used elsewhere.

## After deploying

Check these URLs in a browser:

```text
https://www.staysecure360.com/sitemap.xml
https://www.staysecure360.com/article-sitemap.xml
https://www.staysecure360.com/robots.txt
https://www.staysecure360.com/articles/what-is-vishing-emerging-everything-you-need-to-know
```

Then in Google Search Console:

1. Submit only `sitemap.xml`.
2. Inspect an article URL using the `www` version.
3. Confirm the user-declared canonical is the same `www /articles/...` URL.
4. Test live URL.
5. Request indexing.

## Important note

Google may continue showing older errors for days or weeks. The important check is the **Live URL Test**, not only the historical coverage report.

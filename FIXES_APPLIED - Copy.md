Global fixes applied for Lighthouse/PageSpeed issues:

1. Public Supabase queries moved to a cookie-free read-only client so public pages can use ISR/static caching reliably.
2. Middleware restricted to /admin/* and /login only.
3. Topics and other public pages moved off force-dynamic and onto revalidate=600 where appropriate.
4. Security headers scoped away from Next static asset paths to reduce asset/header conflicts.
5. Added long-lived immutable cache headers for /_next/static and static asset file types.
6. Removed Google font dependency from root layout and used a system font stack.
7. Added preconnect + dns-prefetch for YouTube thumbnail hosts.
8. Added reusable YouTubeThumbnail component with fallback thumbnail chain (hq -> mq/default) so new videos/articles inherit safer thumbnail loading.
9. Reworked VideoEmbed to use a stable aspect-ratio container and button-based poster state to prevent layout shifts.
10. Updated metadata/schema YouTube thumbnails from maxresdefault to hqdefault for safer global behaviour.
11. Slightly improved footer contrast.
12. Enabled optimizePackageImports for lucide-react.


## Hotfix – admin draft visibility
- Restored authenticated server-side queries for admin article list/detail pages.
- This fixes the 404 that occurred right after saving a new draft from the article generator or article form.
- Cause: admin pages were accidentally switched to the public Supabase client, which can only read published content under RLS.

## 2026-04-22: Global YouTube preconnect cleanup

- Removed global `preconnect`/`dns-prefetch` hints for `img.youtube.com` and `i.ytimg.com` from `app/layout.tsx`.
- Why: article/video thumbnails are rendered through Next.js `next/image`, so the browser requests `/_next/image` from your own origin during initial load. That made the YouTube preconnect hints show up as **unused preconnects** in PageSpeed, even on articles with a YouTube video.
- Effect: the fix now applies site-wide to all current and future articles/videos without changing your article generation workflow.

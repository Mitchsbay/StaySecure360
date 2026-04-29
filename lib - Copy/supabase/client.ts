// ============================================================
// Supabase Browser Client
// Use in Client Components only ('use client')
// ============================================================
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
  // must be set in .env.local (local) or Vercel environment variables (production)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

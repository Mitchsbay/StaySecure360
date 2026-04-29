// ============================================================
// Supabase Build-Time Client (kept for reference only)
//
// All generateStaticParams have been removed in favour of
// fully dynamic pages (force-dynamic), so this file is no
// longer called during the build. It is retained in case
// you want to re-enable static generation in the future.
// ============================================================
import { createClient } from '@supabase/supabase-js'

export function createBuildClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase environment variables are not set. ' +
      'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.'
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

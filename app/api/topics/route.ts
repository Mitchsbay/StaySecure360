// ============================================================
// /api/topics — Public read-only topics list
// Used by client components that need to load topics
// ============================================================
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const adminClient = createAdminClient()
  const { data: topics, error } = await adminClient
    .from('topics')
    .select('id, name, slug, parent_id, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ topics: topics ?? [] })
}

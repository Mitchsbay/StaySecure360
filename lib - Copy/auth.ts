// ============================================================
// StaySecure360 — Auth Helpers
// ============================================================
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

// Require authenticated user — redirect to login if not
export async function requireAuth() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return user
}

// Require admin or editor role
// Uses the admin client for the profile lookup to bypass RLS policies
// that may prevent the session client from reading the profiles table.
export async function requireAdminRole(): Promise<Profile> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Use admin client to bypass RLS on profiles table
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    redirect('/admin/login')
  }

  return profile as Profile
}

// Get current user profile (returns null if not authenticated)
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Use admin client to bypass RLS on profiles table
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile as Profile | null
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminEmails() {
  const fromEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const emails = fromEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  // Safe project fallback so the owner can bootstrap the first admin account.
  if (!emails.includes('mtchlsosa@gmail.com')) {
    emails.push('mtchlsosa@gmail.com');
  }

  return emails;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase public environment variables.' },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return NextResponse.json({ error: 'Missing auth token.' }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: 'Invalid auth session.' }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const userEmail = user.email.toLowerCase();
    const isBootstrapAdmin = getAdminEmails().includes(userEmail);

    let { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id,email,role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: `Could not read profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      const role = isBootstrapAdmin ? 'admin' : 'user';
      const { data: insertedProfile, error: insertError } = await adminClient
        .from('profiles')
        .insert({ id: user.id, email: user.email, role })
        .select('id,email,role')
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: `Could not create profile: ${insertError.message}` },
          { status: 500 }
        );
      }

      profile = insertedProfile;
    } else if (isBootstrapAdmin && profile.role !== 'admin') {
      const { data: updatedProfile, error: updateError } = await adminClient
        .from('profiles')
        .update({ email: user.email, role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select('id,email,role')
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: `Could not update admin role: ${updateError.message}` },
          { status: 500 }
        );
      }

      profile = updatedProfile;
    }

    return NextResponse.json({ role: profile.role });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected role verification error.' },
      { status: 500 }
    );
  }
}

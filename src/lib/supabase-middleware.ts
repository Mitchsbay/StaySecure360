import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

function getAdminEmails() {
  const fromEnv = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const emails = fromEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!emails.includes('mtchlsosa@gmail.com')) {
    emails.push('mtchlsosa@gmail.com');
  }

  return emails;
}

async function getRoleWithServiceClient(userId: string, email?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const adminClient = createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminEmails = getAdminEmails();
  const userEmail = email?.toLowerCase() || '';
  const isBootstrapAdmin = adminEmails.includes(userEmail);

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id,email,role')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    const role = isBootstrapAdmin ? 'admin' : 'user';
    const { data: insertedProfile } = await adminClient
      .from('profiles')
      .insert({ id: userId, email, role })
      .select('id,email,role')
      .single();

    return insertedProfile?.role || null;
  }

  if (isBootstrapAdmin && profile.role !== 'admin') {
    const { data: updatedProfile } = await adminClient
      .from('profiles')
      .update({ role: 'admin', email, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id,email,role')
      .single();

    return updatedProfile?.role || 'admin';
  }

  return profile.role;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const role = await getRoleWithServiceClient(user.id, user.email);

    if (!role || !['admin', 'editor'].includes(role)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (isLoginRoute && user) {
    const role = await getRoleWithServiceClient(user.id, user.email);

    if (role && ['admin', 'editor'].includes(role)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return supabaseResponse;
}

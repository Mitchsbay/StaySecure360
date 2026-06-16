import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get('email') as string;

  if (!email) {
    return NextResponse.redirect(new URL('/?error=missing_email', request.url));
  }

  const { error } = await supabase.from('subscribers').insert({
    email,
    source_page: 'homepage',
    consent: true,
  });

  if (error) {
    console.error('Subscribe error:', error);
  }

  return NextResponse.redirect(new URL('/?subscribed=true', request.url));
}

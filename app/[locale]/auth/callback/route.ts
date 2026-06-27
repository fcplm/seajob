import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { locale: string } }
) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = params.locale

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=auth`, request.url))
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
}

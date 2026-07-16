import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Run i18n middleware first
  const response = intlMiddleware(request)

  // Detect locale from pathname
  const locale = pathname.startsWith('/ru') ? 'ru' : 'en'

  // Auth guard: protect /[locale]/dashboard/*
  const isDashboard = pathname.match(/^\/(en|ru)\/dashboard/)
  if (!isDashboard) return response

  // Check Supabase session — wrap in try/catch so placeholder env values
  // or network errors never crash the middleware; treat failures as "no session"
  try {
    let supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Copy next-intl locale headers so i18n/request.ts gets the locale
    response.headers.forEach((value, key) => {
      supabaseResponse.headers.set(key, value)
    })

    return supabaseResponse
  } catch {
    // Session check failed (e.g. invalid Supabase URL in dev) — redirect to login
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

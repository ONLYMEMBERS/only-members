import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return res

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        res = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        )
        Object.entries(headers ?? {}).forEach(([k, v]) =>
          res.headers.set(k, v)
        )
      },
    },
  })

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname
  const isLoginPage = pathname === '/admin'

  // Protect /cuenta
  if (pathname === '/cuenta' && !session) {
    return NextResponse.redirect(new URL('/?login=true', req.url))
  }

  if (pathname.startsWith('/admin') && !isLoginPage && !session) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }
  return res
}

export const config = { matcher: ['/admin', '/admin/:path*', '/cuenta'] }

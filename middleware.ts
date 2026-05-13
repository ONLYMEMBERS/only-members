import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
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

  // Protect /scan — only logged in users with scanner_permissions
  if (pathname === '/scan') {
    if (!session) {
      return NextResponse.redirect(new URL('/cuenta?redirect=scan', req.url))
    }
    return res
  }

  // /cuenta is NOT protected — the page handles auth state internally
  if (pathname.startsWith('/admin') && !isLoginPage && !session) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  // For authenticated admin routes, check role-based permissions
  if (pathname.startsWith('/admin') && !isLoginPage && session) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      try {
        const adminClient = createSupabaseAdmin(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        const { data: permission } = await adminClient
          .from('admin_permissions')
          .select('role, allowed_sections')
          .eq('email', session.user.email)
          .eq('active', true)
          .maybeSingle()

        // No entry in admin_permissions = principal admin (full access)
        if (!permission) return res

        // Admin role has full access
        if (permission.role === 'admin') return res

        // Extract section from /admin/[section]/...
        const section = pathname.split('/')[2]
        if (!section || section === 'dashboard') return res

        // Check if user has access to this section
        if (!permission.allowed_sections?.includes(section)) {
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        }
      } catch {
        // If DB check fails, allow through (fail open for admins)
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/scan'],
}

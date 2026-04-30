'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let redirected = false
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null

    function go(path: string) {
      if (redirected) return
      redirected = true
      router.replace(path)
    }

    // Error in hash — expired link
    const hash = window.location.hash
    if (hash.includes('error=access_denied') || hash.includes('error_code=otp_expired')) {
      window.history.replaceState(null, '', window.location.pathname)
      go('/?auth_error=expired')
      return
    }

    // PKCE flow: code in query params
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        go(error ? '/?auth_error=expired' : '/cuenta')
      })
      return
    }

    // Implicit flow: Supabase detects access_token from hash via detectSessionInUrl
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        go('/cuenta')
        return
      }

      // Session not yet ready — wait for SIGNED_IN event
      const timeout = setTimeout(() => go('/?auth_error=expired'), 6000)

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          clearTimeout(timeout)
          go('/cuenta')
        }
      })
      subscription = data.subscription
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '0.5px solid rgba(201,168,76,0.4)',
        borderTop: '0.5px solid #C9A84C',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{
        fontFamily: 'var(--font-cormorant)',
        fontSize: '18px',
        color: 'rgba(245,240,232,0.6)',
        fontWeight: 300,
      }}>
        Accediendo...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

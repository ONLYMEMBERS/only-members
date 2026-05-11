'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useAuthModal } from '@/lib/auth-modal-context'

export default function UserFloatingButton() {
  const router = useRouter()
  const { openModal } = useAuthModal()
  const [hasSession, setHasSession] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session)
      setLoaded(true)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session)
      setLoaded(true)
    })

    const onFocus = () => checkSession()
    const onVisibility = () => { if (!document.hidden) checkSession() }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  if (!loaded) return null

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '32px',
    left: '32px',
    border: '0.5px solid rgba(201,168,76,0.5)',
    background: 'rgba(10,10,15,0.92)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    backdropFilter: 'blur(8px)',
    transition: 'all 200ms ease',
    boxShadow: '0 0 20px rgba(201,168,76,0.1)',
  }

  if (hasSession) {
    return (
      <button
        onClick={() => router.push('/cuenta')}
        aria-label="Mi cuenta"
        style={{ ...baseStyle, width: '44px', height: '44px', borderRadius: '50%' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(201,168,76,0.12)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(10,10,15,0.92)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={openModal}
      aria-label="Ingresar"
      style={{ ...baseStyle, height: '36px', borderRadius: '18px', padding: '0 16px' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(201,168,76,0.12)'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(10,10,15,0.92)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <span style={{
        fontFamily: 'var(--font-inter)',
        fontWeight: 300,
        fontSize: '10px',
        letterSpacing: '0.14em',
        color: '#C9A84C',
      }}>
        INGRESAR
      </span>
    </button>
  )
}

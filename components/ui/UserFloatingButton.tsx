'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export function UserFloatingButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setShow(!!data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setShow(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!show) return null

  return (
    <Link
      href="/cuenta"
      title="Mi cuenta"
      className="bottom-24 md:bottom-8"
      style={{
        position: 'fixed',
        left: '32px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'rgba(10,10,15,0.9)',
        border: '0.5px solid rgba(201,168,76,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
        backdropFilter: 'blur(8px)',
        textDecoration: 'none',
        transition: 'border-color 200ms, background 200ms, transform 200ms',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(201,168,76,0.12)'
        el.style.borderColor = 'rgba(201,168,76,0.7)'
        el.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(10,10,15,0.9)'
        el.style.borderColor = 'rgba(201,168,76,0.4)'
        el.style.transform = 'scale(1)'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </Link>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export function AdminFloatingButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setShow(!!data.session)
    })
  }, [])

  if (!show) return null

  return (
    <Link
      href="/admin/dashboard"
      title="Admin"
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
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
        transition: 'border-color 200ms, background 200ms',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(201,168,76,0.12)'
        el.style.borderColor = 'rgba(201,168,76,0.7)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(10,10,15,0.9)'
        el.style.borderColor = 'rgba(201,168,76,0.4)'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    </Link>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

const STORAGE_KEY = 'om_cookies_accepted'

export function CookieBanner() {
  const { lang } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const text = lang === 'es'
    ? 'Usamos cookies para mejorar tu experiencia y mantener tu sesión activa. Al continuar, aceptás nuestra'
    : 'We use cookies to improve your experience and keep your session active. By continuing, you accept our'
  const linkLabel = lang === 'es' ? 'Política de Cookies' : 'Cookie Policy'
  const acceptLabel = lang === 'es' ? 'ACEPTAR' : 'ACCEPT'
  const essentialLabel = lang === 'es' ? 'SOLO ESENCIALES' : 'ESSENTIAL ONLY'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        background: 'rgba(10,10,15,0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '0.5px solid rgba(201,168,76,0.2)',
        padding: 'clamp(16px,3vw,20px) clamp(24px,5vw,48px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
      }}
    >
      <p style={{
        fontFamily: 'var(--font-inter)',
        fontWeight: 300,
        fontSize: '12px',
        color: 'rgba(245,240,232,0.6)',
        lineHeight: 1.6,
        margin: 0,
        flex: '1 1 300px',
      }}>
        {text}{' '}
        <Link
          href="/legal/cookies"
          style={{
            color: 'rgba(201,168,76,0.8)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            transition: 'color 200ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#C9A84C' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.8)' }}
        >
          {linkLabel}
        </Link>
        .
      </p>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={accept}
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 500,
            fontSize: '10px',
            letterSpacing: '0.12em',
            padding: '10px 20px',
            background: 'rgba(201,168,76,0.08)',
            border: '0.5px solid rgba(201,168,76,0.4)',
            borderRadius: '4px',
            color: '#C9A84C',
            cursor: 'pointer',
            transition: 'background 200ms',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.18)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)' }}
        >
          {acceptLabel}
        </button>
        <button
          onClick={accept}
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 300,
            fontSize: '10px',
            letterSpacing: '0.08em',
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(245,240,232,0.3)',
            cursor: 'pointer',
            transition: 'color 200ms',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.6)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.3)' }}
        >
          {essentialLabel}
        </button>
      </div>
    </div>
  )
}

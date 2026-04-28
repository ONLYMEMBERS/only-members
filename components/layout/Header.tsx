'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'

export function Header() {
  const { lang, setLang } = useI18n()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[500] flex items-center justify-between"
      style={{
        padding: scrolled ? '14px 32px' : '22px 32px',
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid rgba(201,168,76,0.08)',
        transition: 'padding 300ms ease',
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 500,
          fontSize: 'clamp(14px, 3vw, 20px)',
          letterSpacing: '0.22em',
          color: 'var(--bone)',
          whiteSpace: 'nowrap',
        }}
      >
        ONLY MEMBERS
      </span>

      {/* Lang Toggle */}
      <div
        className="flex items-center gap-2"
        style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.1em' }}
      >
        <button
          onClick={() => setLang('es')}
          style={{ color: lang === 'es' ? 'var(--bone)' : 'var(--text-secondary)', transition: 'color 200ms', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ES
        </button>
        <span style={{ color: 'rgba(201,168,76,0.3)', userSelect: 'none' }}>|</span>
        <button
          onClick={() => setLang('en')}
          style={{ color: lang === 'en' ? 'var(--bone)' : 'var(--text-secondary)', transition: 'color 200ms', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          EN
        </button>
      </div>
    </header>
  )
}

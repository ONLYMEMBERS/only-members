'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'

interface Props {
  cities: string[]
}

export function Header({ cities }: Props) {
  const { lang, setLang, city, setCity } = useI18n()
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
        padding: scrolled ? '14px 40px' : '22px 40px',
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
          fontSize: '15px',
          letterSpacing: '0.22em',
          color: 'var(--bone)',
        }}
      >
        ONLY MEMBERS
      </span>

      {/* City Selector */}
      <nav className="flex items-center gap-1">
        {cities.map((c, i) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 300,
              fontSize: '10px',
              letterSpacing: '0.12em',
              padding: '5px 14px',
              borderRadius: '20px',
              border: city === c ? '0.5px solid var(--gold)' : '0.5px solid transparent',
              color: city === c ? 'var(--gold)' : 'var(--text-secondary)',
              background: 'transparent',
              transition: 'all 250ms ease',
              marginLeft: i > 0 ? '4px' : 0,
            }}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* Lang Toggle */}
      <div
        className="flex items-center gap-2"
        style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.1em' }}
      >
        <button
          onClick={() => setLang('es')}
          style={{ color: lang === 'es' ? 'var(--bone)' : 'var(--text-secondary)', transition: 'color 200ms' }}
        >
          ES
        </button>
        <span style={{ color: 'rgba(201,168,76,0.3)', userSelect: 'none' }}>|</span>
        <button
          onClick={() => setLang('en')}
          style={{ color: lang === 'en' ? 'var(--bone)' : 'var(--text-secondary)', transition: 'color 200ms' }}
        >
          EN
        </button>
      </div>
    </header>
  )
}

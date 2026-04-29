'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'

interface Props {
  cities: string[]
}

export function CitySelector({ cities }: Props) {
  const { city, setCity } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 200)
    return () => clearTimeout(timer)
  }, [])

  if (cities.length <= 1) return null

  return (
    <nav
      aria-label="Seleccionar ciudad"
      style={{
        position: 'fixed',
        top: '90px',
        left: '50%',
        zIndex: 100,
        display: 'flex',
        gap: '6px',
        padding: '6px 10px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    >
      {cities.map((c) => (
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
            border: city === c
              ? '0.5px solid var(--gold)'
              : '0.5px solid rgba(201,168,76,0.2)',
            color: city === c ? 'var(--gold)' : 'var(--text-secondary)',
            background: 'rgba(10,10,15,0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'all 250ms ease',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {c.toUpperCase()}
        </button>
      ))}
    </nav>
  )
}

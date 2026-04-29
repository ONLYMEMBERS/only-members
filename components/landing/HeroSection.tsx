'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { ParticleCanvas } from './ParticleCanvas'

export function HeroSection() {
  const { t } = useI18n()
  const [reveal, setReveal] = useState(false)
  const [lettersVisible, setLettersVisible] = useState<boolean[]>([])
  const letters = t.heroTitle.split('')

  useEffect(() => {
    const timer = setTimeout(() => setReveal(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!reveal) return
    const delay = 300
    const stagger = 40
    const timers: ReturnType<typeof setTimeout>[] = []

    letters.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setLettersVisible((prev) => {
            const next = [...prev]
            next[i] = true
            return next
          })
        }, delay + i * stagger)
      )
    })

    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal])

  const scrollToEvents = () => {
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      className="relative flex items-center justify-center"
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0d0d18 0%, #0a0a0f 40%, #120d08 100%)',
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #0d0d18 0%, #0a0a0f 40%, #120d08 100%)',
          zIndex: 1,
        }}
      />

      {/* Particle canvas */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <ParticleCanvas />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center text-center px-6" style={{ zIndex: 3, width: '100%' }}>
        {/* Label */}
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 300,
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: 'var(--gold)',
            opacity: reveal ? 1 : 0,
            transition: 'opacity 600ms ease 0ms',
            marginBottom: '20px',
            display: 'block',
          }}
        >
          {t.heroLabel}
        </span>

        {/* Title */}
        <h1
          aria-label={t.heroTitle}
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontSize: 'clamp(32px, 7vw, 80px)',
            letterSpacing: '0.18em',
            marginBottom: '24px',
            lineHeight: 1,
            wordBreak: 'keep-all',
            maxWidth: '90vw',
            margin: '0 auto 24px',
          }}
        >
          {/* Gradient shimmer wrapper */}
          <span
            style={{
              background: 'linear-gradient(90deg, #F5F0E8 0%, #F5F0E8 35%, #C9A84C 50%, #F5F0E8 65%, #F5F0E8 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'title-shimmer 4s linear infinite',
            }}
          >
            {letters.map((char, i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  display: 'inline',
                  opacity: lettersVisible[i] ? 1 : 0,
                  transition: 'opacity 400ms ease',
                  whiteSpace: char === ' ' ? 'pre' : 'normal',
                }}
              >
                {char}
              </span>
            ))}
          </span>
        </h1>

        {/* Subtitle — FIX 3: uppercase + clamp */}
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontSize: 'clamp(11px, 2.5vw, 18px)',
            color: 'rgba(245,240,232,0.6)',
            letterSpacing: '0.08em',
            opacity: reveal ? 1 : 0,
            transform: reveal ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 700ms ease 1200ms, transform 700ms ease 1200ms',
            marginBottom: '40px',
          }}
        >
          {t.heroSubtitle}
        </p>

        {/* CTA — FIX 6: min-width + centering */}
        <button
          onClick={scrollToEvents}
          className="relative overflow-hidden"
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 500,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: 'var(--gold)',
            border: '0.5px solid rgba(201,168,76,0.6)',
            background: 'rgba(201,168,76,0.08)',
            padding: '14px 32px',
            borderRadius: '2px',
            minWidth: '180px',
            display: 'block',
            margin: '0 auto',
            boxSizing: 'border-box',
            opacity: reveal ? 1 : 0,
            transform: reveal ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 700ms ease 1600ms, transform 700ms ease 1600ms',
          }}
        >
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.18) 50%, transparent 100%)',
              animation: 'shimmer 4s ease-in-out infinite',
              animationDelay: '2s',
            }}
          />
          {t.heroCta}
        </button>
      </div>
    </section>
  )
}

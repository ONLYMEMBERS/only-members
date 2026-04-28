'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { ParticleCanvas } from './ParticleCanvas'
import type { Event } from '@/lib/types'

interface Props {
  allEvents?: Event[]
}

export function HeroSection({ allEvents = [] }: Props) {
  const { t, city } = useI18n()
  const [reveal, setReveal] = useState(false)
  const [lettersVisible, setLettersVisible] = useState<boolean[]>([])
  const [heroImage, setHeroImage] = useState('')
  const [imageOpacity, setImageOpacity] = useState(1)
  const letters = t.heroTitle.split('')

  // Find active event's hero image for current city
  const activeEvent = allEvents.find(
    (e) => e.city === city && ['active', 'soon'].includes(e.status) && e.hero_image
  )
  const targetImage = activeEvent?.hero_image ?? ''

  // Crossfade hero image when city changes
  useEffect(() => {
    if (targetImage === heroImage) return
    if (!heroImage) {
      setHeroImage(targetImage)
      return
    }
    setImageOpacity(0)
    const timer = setTimeout(() => {
      setHeroImage(targetImage)
      setImageOpacity(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [targetImage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reveal sequence
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
        background: '#0a0a0f',
      }}
    >
      {/* Hero image */}
      {heroImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: imageOpacity,
            transition: 'opacity 600ms ease',
            zIndex: 0,
          }}
        />
      )}

      {/* Gradient fallback / overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: heroImage
            ? 'rgba(0,0,0,0.55)'
            : 'linear-gradient(160deg, #1a1a2e 0%, #0d0d1a 60%, #1a120a 100%)',
          zIndex: 1,
        }}
      />

      {/* Particle canvas */}
      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        <ParticleCanvas />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center text-center px-6" style={{ zIndex: 3 }}>
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

        {/* Title — letter by letter */}
        <h1
          aria-label={t.heroTitle}
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontSize: 'clamp(48px, 8vw, 96px)',
            color: 'var(--bone)',
            letterSpacing: '0.18em',
            marginBottom: '24px',
            lineHeight: 1,
          }}
        >
          {letters.map((char, i) => (
            <span
              key={i}
              aria-hidden
              style={{
                display: 'inline-block',
                opacity: lettersVisible[i] ? 1 : 0,
                transform: lettersVisible[i] ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 400ms ease, transform 400ms ease',
                whiteSpace: char === ' ' ? 'pre' : 'normal',
              }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: '20px',
            color: 'rgba(245,240,232,0.6)',
            opacity: reveal ? 1 : 0,
            transform: reveal ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 700ms ease 1200ms, transform 700ms ease 1200ms',
            marginBottom: '40px',
          }}
        >
          {t.heroSubtitle}
        </p>

        {/* CTA */}
        <button
          onClick={scrollToEvents}
          className="relative overflow-hidden"
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 500,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: 'var(--gold)',
            border: '0.5px solid var(--gold)',
            background: 'rgba(201,168,76,0.06)',
            padding: '14px 32px',
            borderRadius: '2px',
            opacity: reveal ? 1 : 0,
            transform: reveal ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 700ms ease 1600ms, transform 700ms ease 1600ms',
          }}
        >
          {/* Shimmer */}
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

'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'

export function ManifestoSection() {
  const { t } = useI18n()
  const [visibleLines, setVisibleLines] = useState<boolean[]>([false, false, false])
  const [lineVisible, setLineVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([])

  useEffect(() => {
    const sectionObs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setLineVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) sectionObs.observe(sectionRef.current)

    const observers = lineRefs.current.map((el, i) => {
      if (!el) return null
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleLines((prev) => {
                const next = [...prev]
                next[i] = true
                return next
              })
            }, i * 250)
          }
        },
        { threshold: 0.3 }
      )
      observer.observe(el)
      return observer
    })

    return () => {
      sectionObs.disconnect()
      observers.forEach((obs) => obs?.disconnect())
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        padding: '120px 24px',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        borderTop: '0.5px solid rgba(201,168,76,0.08)',
        borderBottom: '0.5px solid rgba(201,168,76,0.08)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '680px' }}>
        {/* Decorative gold line */}
        <div
          style={{
            width: '60px',
            height: '1px',
            background: 'var(--gold)',
            margin: '0 auto 48px',
            opacity: lineVisible ? 0.6 : 0,
            transform: lineVisible ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'opacity 600ms ease, transform 600ms ease',
            transformOrigin: 'center',
          }}
        />

        {t.manifesto.map((line, i) => (
          <p
            key={i}
            ref={(el) => { lineRefs.current[i] = el }}
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: i === 0 ? 300 : 400,
              fontStyle: 'italic',
              fontSize: 'clamp(18px, 2.8vw, 26px)',
              color: 'rgba(245,240,232,0.9)',
              lineHeight: 2,
              letterSpacing: '0.02em',
              marginBottom: i < t.manifesto.length - 1 ? '1.6em' : 0,
              opacity: visibleLines[i] ? 1 : 0,
              transform: visibleLines[i] ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 700ms ease, transform 700ms ease',
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  )
}

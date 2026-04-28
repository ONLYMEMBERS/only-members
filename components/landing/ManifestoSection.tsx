'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'

export function ManifestoSection() {
  const { t } = useI18n()
  const [visibleLines, setVisibleLines] = useState<boolean[]>([false, false, false])
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([])

  useEffect(() => {
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

    return () => observers.forEach((obs) => obs?.disconnect())
  }, [])

  return (
    <section
      style={{
        padding: '120px 24px',
        background: 'var(--bg-secondary)',
        borderTop: '0.5px solid rgba(201,168,76,0.08)',
        borderBottom: '0.5px solid rgba(201,168,76,0.08)',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '680px' }}>
        {t.manifesto.map((line, i) => (
          <p
            key={i}
            ref={(el) => { lineRefs.current[i] = el }}
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontStyle: i > 0 ? 'italic' : 'normal',
              fontSize: 'clamp(16px, 2.2vw, 22px)',
              color: 'rgba(245,240,232,0.8)',
              lineHeight: 1.8,
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

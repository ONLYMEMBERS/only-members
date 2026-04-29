'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Event } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface EventCardProps {
  event: Event
  staggerIndex: number
  onRequestAccess: (event: Event) => void
}

function GeometricDetail() {
  return (
    <svg
      width="48" height="48" viewBox="0 0 48 48"
      style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.14, pointerEvents: 'none' }}
    >
      {/* 3x3 dot grid */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <circle key={`${row}-${col}`} cx={8 + col * 16} cy={8 + row * 16} r="1.5" fill="#C9A84C" />
        ))
      )}
      {/* Diagonal lines */}
      <line x1="0" y1="0" x2="48" y2="48" stroke="#C9A84C" strokeWidth="0.5"/>
      <line x1="48" y1="0" x2="0" y2="48" stroke="#C9A84C" strokeWidth="0.5"/>
    </svg>
  )
}

function StatusBadge({ status }: { status: Event['status'] }) {
  const { t } = useI18n()
  const labelMap: Record<string, string> = {
    active: t.statusActive,
    soon: t.statusSoon,
    closed: t.statusClosed,
    archived: t.statusArchived,
    draft: 'DRAFT',
  }
  return (
    <span
      style={{
        fontFamily: 'var(--font-inter)',
        fontWeight: 400,
        fontSize: '9px',
        letterSpacing: '0.12em',
        color: 'var(--gold)',
        border: '0.5px solid var(--gold)',
        background: 'rgba(201,168,76,0.08)',
        padding: '3px 8px',
        borderRadius: '2px',
        display: 'inline-block',
      }}
    >
      {labelMap[status] ?? status.toUpperCase()}
    </span>
  )
}

export function EventCard({ event, staggerIndex, onRequestAccess }: EventCardProps) {
  const { t } = useI18n()
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const [imgError, setImgError] = useState(false)
  const coverBg = (event.cover_image && !imgError)
    ? `url(${event.cover_image})`
    : 'linear-gradient(160deg, #1a1a2e 0%, #0d0d1a 60%, #1a120a 100%)'

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: hovered ? '0.5px solid rgba(201,168,76,0.45)' : '0.5px solid rgba(201,168,76,0.2)',
        transform: visible
          ? hovered ? 'scale(1.015)' : 'translateY(0) scale(1)'
          : 'translateY(24px)',
        opacity: visible ? 1 : 0,
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${staggerIndex * 120}ms,
                     transform 700ms cubic-bezier(0.16,1,0.3,1) ${staggerIndex * 120}ms,
                     border-color 300ms ease`,
        background: 'var(--bg-secondary)',
      }}
    >
      {/* Photo area 4:5 — Link to event page */}
      <Link href={`/events/${event.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="relative" style={{ aspectRatio: '4/5', background: '#0d0d1a' }}>
        <div
          className="absolute inset-0"
          style={{ background: coverBg, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        {/* Hidden img to detect load error */}
        {event.cover_image && !imgError && (
          <img src={event.cover_image} alt="" style={{ display: 'none' }} onError={() => setImgError(true)} />
        )}
        <GeometricDetail />

        {/* Bottom gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: '55%',
            background: 'linear-gradient(to top, rgba(10,8,4,0.82) 0%, transparent 100%)',
          }}
        />

        {/* Overlay content */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1">
          <StatusBadge status={event.status} />
          <h3
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 500,
              fontSize: '14px',
              color: 'var(--bone)',
              marginTop: '6px',
              lineHeight: 1.3,
            }}
          >
            {event.name}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: '10px',
              color: 'rgba(245,240,232,0.6)',
            }}
          >
            {event.subtitle}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 300,
              fontSize: '9px',
              letterSpacing: '0.07em',
              color: 'rgba(201,168,76,0.65)',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            {event.city} · {event.country}
          </p>
        </div>
      </div>
      </Link>

      {/* Lower panel */}
      <div
        style={{
          backdropFilter: 'blur(14px)',
          background: 'rgba(8,6,18,0.78)',
          borderTop: '0.5px solid rgba(201,168,76,0.13)',
          padding: '14px 16px',
        }}
      >
        {/* Secret location */}
        {event.secret_location && (
          <div className="flex items-center gap-2 mb-3">
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--gold)',
                display: 'inline-block',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontWeight: 300,
                fontSize: '9px',
                letterSpacing: '0.08em',
                color: 'rgba(201,168,76,0.55)',
              }}
            >
              {t.secretLocation}
            </span>
          </div>
        )}

        {/* Date row */}
        <div className="flex items-baseline gap-3 mb-3">
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 300,
              fontSize: '9px',
              letterSpacing: '0.08em',
              color: 'rgba(201,168,76,0.55)',
            }}
          >
            {t.dateLabel}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 500,
              fontSize: '11px',
              color: 'var(--bone)',
            }}
          >
            {event.date}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="mb-4"
          style={{
            height: '1.5px',
            background: 'rgba(201,168,76,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${event.progress_value}%`,
              background: 'rgba(201,168,76,0.38)',
              borderRadius: '2px',
              transition: 'width 800ms cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>

        {/* Request access button */}
        <button
          onClick={() => onRequestAccess(event)}
          className="w-full relative overflow-hidden"
          style={{
            fontFamily: 'var(--font-inter)',
            fontWeight: 500,
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'var(--gold)',
            border: '0.5px solid rgba(201,168,76,0.3)',
            background: 'rgba(201,168,76,0.06)',
            padding: '10px 16px',
            borderRadius: '4px',
            transition: 'background 200ms ease, border-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.background = 'rgba(201,168,76,0.14)'
            el.style.borderColor = 'rgba(201,168,76,0.6)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.background = 'rgba(201,168,76,0.06)'
            el.style.borderColor = 'rgba(201,168,76,0.3)'
          }}
        >
          {t.requestAccess}
        </button>
      </div>
    </div>
  )
}

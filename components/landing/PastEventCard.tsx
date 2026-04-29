'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Event } from '@/lib/placeholder-data'

interface PastEventCardProps {
  event: Event
  staggerIndex: number
}

export function PastEventCard({ event, staggerIndex }: PastEventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const coverBg = event.cover_image
    ? `url(${event.cover_image})`
    : 'linear-gradient(160deg, #0d0d18 0%, #080810 60%, #120d06 100%)'

  return (
    <Link href={`/events/${event.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
    <div
      ref={cardRef}
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '0.5px solid rgba(201,168,76,0.12)',
        opacity: visible ? 0.7 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 900ms cubic-bezier(0.16,1,0.3,1) ${staggerIndex * 160}ms,
                     transform 900ms cubic-bezier(0.16,1,0.3,1) ${staggerIndex * 160}ms`,
        background: '#080810',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7' }}
    >
      <div className="relative" style={{ aspectRatio: '4/5' }}>
        <div
          className="absolute inset-0"
          style={{ background: coverBg, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />

        {/* Always-on overlay (darker) */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        />

        {/* Bottom text */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1">
          <h3
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontWeight: 500,
              fontSize: '13px',
              color: 'var(--bone)',
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
              color: 'rgba(245,240,232,0.5)',
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
              color: 'rgba(201,168,76,0.5)',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            {event.city} · {event.country}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontWeight: 300,
              fontSize: '9px',
              letterSpacing: '0.06em',
              color: 'rgba(245,240,232,0.4)',
              marginTop: '4px',
            }}
          >
            {event.date}
          </p>
        </div>
      </div>
    </div>
    </Link>
  )
}

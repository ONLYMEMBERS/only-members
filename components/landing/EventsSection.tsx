'use client'

import { useState, useEffect, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { Event } from '@/lib/types'
import { EventCard } from './EventCard'
import { PastEventCard } from './PastEventCard'
import { RegistrationModal } from '@/components/ui/RegistrationModal'

interface Props {
  allEvents: Event[]
}

function CardSkeleton({ aspect = '4/5' }: { aspect?: string }) {
  return (
    <div
      style={{
        aspectRatio: aspect,
        borderRadius: '14px',
        border: '0.5px solid rgba(201,168,76,0.08)',
        background: 'rgba(201,168,76,0.04)',
        animation: 'skeleton-pulse 1.8s ease-in-out infinite',
      }}
    />
  )
}

export function EventsSection({ allEvents }: Props) {
  const { t, city } = useI18n()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [renderCity, setRenderCity] = useState(city)
  const [opacity, setOpacity] = useState(1)

  // Crossfade: fade out → swap content at opacity=0 → fade in
  useEffect(() => {
    if (city === renderCity) return
    setOpacity(0)
    const timer = setTimeout(() => {
      setRenderCity(city)
      setOpacity(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [city, renderCity])

  const { active, past } = useMemo(() => {
    const cityEvents = allEvents.filter((e) => e.city === renderCity)
    return {
      active: cityEvents
        .filter((e) => ['active', 'soon'].includes(e.status))
        .sort((a, b) => (a.date_start ?? '').localeCompare(b.date_start ?? '')),
      past: cityEvents
        .filter((e) => ['closed', 'archived'].includes(e.status))
        .sort((a, b) => (b.date_start ?? '').localeCompare(a.date_start ?? ''))
        .slice(0, 6),
    }
  }, [allEvents, renderCity])

  return (
    <section
      id="events"
      style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 40px) 80px',
        background: '#07080f',
        position: 'relative',
        opacity,
        transition: 'opacity 400ms ease',
      }}
    >
      {/* City watermark */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-cormorant)',
          fontWeight: 300,
          fontSize: 'clamp(60px, 10vw, 120px)',
          color: 'rgba(245,240,232,0.04)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
          letterSpacing: '0.1em',
        }}
      >
        {renderCity.toUpperCase()}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Active events */}
        {active.length > 0 && (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}
          >
            {active.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                staggerIndex={i}
                onRequestAccess={setSelectedEvent}
              />
            ))}
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <>
            <div style={{ marginTop: '80px', marginBottom: '28px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 300,
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  color: 'rgba(201,168,76,0.4)',
                  textTransform: 'uppercase',
                }}
              >
                {t.eventsTitle}
              </span>
            </div>
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}
            >
              {past.map((event, i) => (
                <PastEventCard key={event.id} event={event} staggerIndex={i} />
              ))}
            </div>
          </>
        )}

        {/* Skeleton — shown when no events for this city */}
        {active.length === 0 && past.length === 0 && (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
      </div>

      <RegistrationModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </section>
  )
}

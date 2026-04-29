import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchEventBySlug, fetchEventSlugs } from '@/lib/supabase'
import { events as placeholderEvents } from '@/lib/placeholder-data'
import { Event } from '@/lib/types'
import { EventPageClient } from '@/components/landing/EventPageClient'

export const dynamicParams = true
export const revalidate = 60

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const event =
    (await fetchEventBySlug(params.slug).catch(() => null)) ??
    placeholderEvents.find((e) => e.slug === params.slug) ??
    null

  if (!event) return { title: 'Only Members' }

  return {
    title: `${event.name} — Only Members`,
    description: event.og_description ?? event.description_es?.slice(0, 160) ?? undefined,
    openGraph: {
      title: event.og_title ?? event.name,
      description: event.og_description ?? event.description_es?.slice(0, 160) ?? '',
      images: event.hero_image ? [{ url: event.hero_image }] : [],
    },
  }
}

export async function generateStaticParams() {
  const slugs = await fetchEventSlugs().catch(() => [] as string[])
  if (slugs.length) return slugs.map((s) => ({ slug: s }))
  return placeholderEvents.map((e) => ({ slug: e.slug }))
}

export default async function EventPage({ params }: PageProps) {
  const event: Event | null =
    (await fetchEventBySlug(params.slug).catch(() => null)) ??
    placeholderEvents.find((e) => e.slug === params.slug) ??
    null

  if (!event) {
    return (
      <main
        style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', color: 'rgba(245,240,232,0.4)',
          fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '14px',
        }}
      >
        Evento no encontrado.
      </main>
    )
  }

  const hasImage = !!event.hero_image
  const visibleSpeakers = (event.speakers ?? []).filter((s: any) => s.visible !== false)
  const partners = event.partners ?? []

  const dateFormatted = event.date_start
    ? new Date(event.date_start).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
        timeZone: event.timezone ?? 'UTC',
      })
    : null

  const statusColors: Record<string, { bg: string; border: string; color: string }> = {
    active:   { bg: 'rgba(72,187,120,0.1)',   border: 'rgba(72,187,120,0.4)',   color: 'rgba(72,187,120,0.9)' },
    soon:     { bg: 'rgba(201,168,76,0.1)',    border: 'rgba(201,168,76,0.35)',  color: '#C9A84C' },
    closed:   { bg: 'rgba(252,129,74,0.1)',   border: 'rgba(252,129,74,0.3)',   color: 'rgba(252,129,74,0.8)' },
    archived: { bg: 'rgba(113,128,150,0.1)',   border: 'rgba(113,128,150,0.3)', color: 'rgba(113,128,150,0.7)' },
    draft:    { bg: 'rgba(113,128,150,0.08)',  border: 'rgba(113,128,150,0.2)', color: 'rgba(113,128,150,0.5)' },
  }
  const statusLabels: Record<string, string> = {
    active: 'ACTIVO', soon: 'PRÓXIMAMENTE', closed: 'CERRADO', archived: 'FINALIZADO', draft: 'BORRADOR',
  }
  const sc = statusColors[event.status] ?? statusColors.draft

  return (
    <main style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Fixed back link */}
      <div style={{ position: 'fixed', top: '24px', left: '32px', zIndex: 500 }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px',
            letterSpacing: '0.14em', color: 'rgba(245,240,232,0.45)',
            textDecoration: 'none', textTransform: 'uppercase',
          }}
        >
          ← ONLY MEMBERS
        </Link>
      </div>

      {/* Hero */}
      <section
        style={{
          height: '100vh', position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start', justifyContent: 'flex-end',
          overflow: 'hidden',
        }}
      >
        {/* Background */}
        {hasImage ? (
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${event.hero_image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, #1a1a2e 0%, #0d0d1a 60%, #1a120a 100%)',
            }}
          />
        )}

        {/* Overlay gradient */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,15,0.96) 0%, rgba(10,10,15,0.45) 55%, rgba(10,10,15,0.2) 100%)',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(40px, 6vw, 80px) clamp(24px, 5vw, 80px)', width: '100%' }}>
          {/* Status badge */}
          <span style={{
            display: 'inline-block', marginBottom: '18px',
            fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '2px',
            background: sc.bg, border: `0.5px solid ${sc.border}`, color: sc.color,
          }}>
            {statusLabels[event.status] ?? event.status.toUpperCase()}
          </span>

          {/* Event name */}
          <h1
            style={{
              fontFamily: 'var(--font-cormorant)', fontWeight: 300,
              fontSize: 'clamp(38px, 7vw, 84px)',
              color: 'var(--bone)', letterSpacing: '0.05em', lineHeight: 1.1,
              maxWidth: '900px', marginBottom: '14px',
            }}
          >
            {event.name}
          </h1>

          {/* Subtitle */}
          {event.subtitle && (
            <p style={{
              fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontStyle: 'italic',
              fontSize: 'clamp(15px, 2.2vw, 22px)', color: 'rgba(245,240,232,0.5)',
              maxWidth: '600px',
            }}>
              {event.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Info: Date + Location */}
      <section
        style={{
          padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          maxWidth: '960px',
          borderBottom: '0.5px solid rgba(201,168,76,0.08)',
        }}
      >
        {/* Date */}
        <div>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '12px' }}>
            FECHA
          </p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(18px, 2.2vw, 24px)', color: 'var(--bone)', marginBottom: event.timezone ? '6px' : 0 }}>
            {dateFormatted ?? 'PRÓXIMAMENTE'}
          </p>
          {event.timezone && dateFormatted && (
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', color: 'rgba(245,240,232,0.3)' }}>
              {event.timezone.replace('_', ' ')}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '12px' }}>
            UBICACIÓN
          </p>
          {event.secret_location ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C', display: 'inline-block', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.65)' }}>
                UBICACIÓN POR REVELAR
              </span>
            </div>
          ) : (
            <div>
              {event.location_name && (
                <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(18px, 2.2vw, 24px)', color: 'var(--bone)', marginBottom: event.location_address ? '6px' : 0 }}>
                  {event.location_name}
                </p>
              )}
              {event.location_address && (
                <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5 }}>
                  {event.location_address}
                </p>
              )}
              {!event.location_name && !event.location_address && (
                <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '14px', color: 'rgba(245,240,232,0.4)' }}>
                  {event.city}, {event.country}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Client: description, dress code, countdown/pre-register, access button */}
      <EventPageClient event={event} />

      {/* Speakers */}
      {visibleSpeakers.length > 0 && (
        <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(24px, 5vw, 80px)', borderTop: '0.5px solid rgba(201,168,76,0.08)' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '40px' }}>
            SPEAKERS
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '36px' }}>
            {visibleSpeakers.map((sp: any) => (
              <div key={sp.id} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  margin: '0 auto 16px',
                  background: sp.photo ? `url(${sp.photo}) center/cover no-repeat` : 'rgba(201,168,76,0.08)',
                  border: '0.5px solid rgba(201,168,76,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!sp.photo && (
                    <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '26px', color: 'rgba(201,168,76,0.5)' }}>
                      {sp.name?.[0] ?? '?'}
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '18px', color: 'var(--bone)', marginBottom: '4px' }}>
                  {sp.name}
                </p>
                {sp.role && (
                  <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.65)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {sp.role}
                  </p>
                )}
                {sp.bio && (
                  <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.45)', lineHeight: 1.65 }}>
                    {sp.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Partners */}
      {partners.length > 0 && (
        <section style={{ padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5vw, 80px)', borderTop: '0.5px solid rgba(201,168,76,0.08)' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '28px' }}>
            PARTNERS
          </p>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
            {partners.map((pt: any) => {
              const inner = pt.logo ? (
                <img
                  src={pt.logo}
                  alt={pt.name ?? ''}
                  style={{ height: '30px', objectFit: 'contain', opacity: 0.65, filter: 'grayscale(30%)' }}
                />
              ) : (
                <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.35)' }}>
                  {pt.name}
                </span>
              )
              return pt.link ? (
                <a key={pt.id} href={pt.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  {inner}
                </a>
              ) : (
                <div key={pt.id}>{inner}</div>
              )
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <div style={{ padding: 'clamp(36px, 4vw, 56px) clamp(24px, 5vw, 80px)', borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', color: 'rgba(245,240,232,0.18)' }}>
          RESILIO®
        </p>
      </div>
    </main>
  )
}

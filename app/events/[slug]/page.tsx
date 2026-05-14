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
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'rgba(245,240,232,0.4)', fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '14px' }}>
        Evento no encontrado.
      </main>
    )
  }

  const visibleSpeakers = (event.speakers ?? []).filter((s: any) => s.visible !== false)
  const partners = event.partners ?? []

  const dateFormatted = event.date_start
    ? new Date(event.date_start).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
      {/* Content container */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(24px,5vw,48px)' }}>

        {/* Back link */}
        <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textDecoration: 'none', textTransform: 'uppercase', display: 'inline-block', marginBottom: '32px' }}>
          ← ONLY MEMBERS
        </Link>

        {/* Status badge */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: '2px', background: sc.bg, border: `0.5px solid ${sc.border}`, color: sc.color }}>
            {statusLabels[event.status] ?? event.status.toUpperCase()}
          </span>
        </div>

        {/* Event name */}
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(28px,6vw,52px)', color: 'var(--bone)', letterSpacing: '0.05em', lineHeight: 1.1, marginBottom: '12px' }}>
          {event.name}
        </h1>

        {/* Subtitle */}
        {event.subtitle && (
          <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(14px,2.5vw,20px)', color: 'rgba(245,240,232,0.6)', marginBottom: '28px' }}>
            {event.subtitle}
          </p>
        )}

        {/* Metadata row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '40px', paddingBottom: '40px', borderBottom: '0.5px solid rgba(201,168,76,0.1)' }}>
          {/* City/Country */}
          {(event.city || event.country) && (
            <div>
              <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '6px' }}>CIUDAD</p>
              <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '13px', color: 'rgba(201,168,76,0.8)' }}>
                {event.city}{event.city && event.country ? ', ' : ''}{event.country}
              </p>
            </div>
          )}

          {/* Date */}
          {dateFormatted && (
            <div>
              <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '6px' }}>FECHA</p>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '18px', color: 'var(--bone)', textTransform: 'capitalize' }}>
                {dateFormatted}
              </p>
            </div>
          )}

          {/* Location */}
          <div>
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '6px' }}>UBICACIÓN</p>
            {event.secret_location ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.65)' }}>UBICACIÓN POR REVELAR</span>
              </div>
            ) : (
              <div>
                {event.location_name && (
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '18px', color: 'var(--bone)', marginBottom: '2px' }}>{event.location_name}</p>
                )}
                {event.location_address && (
                  <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{event.location_address}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client section (description, form, etc.) — full width */}
      <EventPageClient event={event} />

      {/* Speakers */}
      {visibleSpeakers.length > 0 && (
        <section style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(48px,6vw,72px) clamp(24px,5vw,48px)', borderTop: '0.5px solid rgba(201,168,76,0.08)' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '36px' }}>SPEAKERS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '36px' }}>
            {visibleSpeakers.map((sp: any) => (
              <div key={sp.id} style={{ textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 14px', background: sp.photo ? `url(${sp.photo}) center/cover no-repeat` : 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!sp.photo && <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', color: 'rgba(201,168,76,0.5)' }}>{sp.name?.[0] ?? '?'}</span>}
                </div>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '18px', color: 'var(--bone)', marginBottom: '4px' }}>{sp.name}</p>
                {sp.role && <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.65)', marginBottom: '8px', textTransform: 'uppercase' }}>{sp.role}</p>}
                {sp.bio && <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.45)', lineHeight: 1.65 }}>{sp.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Partners */}
      {partners.length > 0 && (
        <section style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(36px,4vw,56px) clamp(24px,5vw,48px)', borderTop: '0.5px solid rgba(201,168,76,0.08)' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase', marginBottom: '24px' }}>PARTNERS</p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {partners.map((pt: any) => {
              const inner = pt.logo
                ? <img src={pt.logo} alt={pt.name ?? ''} style={{ height: '28px', objectFit: 'contain', opacity: 0.65, filter: 'grayscale(30%)' }} />
                : <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.35)' }}>{pt.name}</span>
              return pt.link
                ? <a key={pt.id} href={pt.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{inner}</a>
                : <div key={pt.id}>{inner}</div>
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(32px,4vw,48px) clamp(24px,5vw,48px)', borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.22em', color: 'rgba(245,240,232,0.18)' }}>RESILIO®</p>
      </div>
    </main>
  )
}

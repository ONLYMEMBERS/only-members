'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase-browser'
import { useI18n } from '@/lib/i18n'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const
const TTL_MS = 15 * 60 * 1000

// ─── QR Modal ────────────────────────────────────────────────────────────────

function QrModal({ registration, event, lang, onClose }: {
  registration: any
  event: any
  lang: string
  onClose: () => void
}) {
  const [expiry, setExpiry] = useState(() => Date.now() + TTL_MS)
  const [timeLeft, setTimeLeft] = useState(TTL_MS / 1000)

  useEffect(() => {
    const tick = setInterval(() => {
      const remaining = expiry - Date.now()
      if (remaining <= 0) {
        const ne = Date.now() + TTL_MS
        setExpiry(ne)
        setTimeLeft(TTL_MS / 1000)
      } else {
        setTimeLeft(Math.ceil(remaining / 1000))
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [expiry])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const qrContent = btoa(JSON.stringify({ rid: registration.id, exp: expiry, v: 1 }))
  const pct = (timeLeft / (TTL_MS / 1000)) * 100

  const dateStr = event.date_start
    ? new Date(event.date_start).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit', month: 'long', year: 'numeric',
        timeZone: event.timezone ?? 'UTC',
      })
    : ''

  const mins = Math.floor(timeLeft / 60)
  const secs = String(timeLeft % 60).padStart(2, '0')

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(5,5,10,0.97)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        padding: '32px',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'rgba(245,240,232,0.5)', fontSize: '32px', lineHeight: 1, padding: '8px',
        }}
      >
        ×
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '360px', width: '100%' }}
      >
        <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8', textAlign: 'center', margin: 0 }}>
          {registration.first_name} {registration.last_name}
        </p>

        <div style={{ padding: '16px', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '12px' }}>
          <QRCodeSVG value={qrContent} size={300} bgColor="transparent" fgColor="#F5F0E8" level="H" />
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ width: '100%', height: '2px', background: 'rgba(245,240,232,0.08)', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: pct > 30 ? '#C9A84C' : '#e57373',
              transition: 'width 1s linear',
              borderRadius: '1px',
            }} />
          </div>
          <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', textAlign: 'center', marginTop: '8px', letterSpacing: '0.06em' }}>
            {lang === 'es' ? 'Válido por' : 'Valid for'} {mins}:{secs}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.6)', letterSpacing: '0.06em', margin: 0 }}>
            {event.name}
          </p>
          {dateStr && (
            <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.35)', letterSpacing: '0.04em', marginTop: '4px' }}>
              {dateStr}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ reg, payment, onRsvp }: {
  reg: any
  payment: any
  onRsvp: (token: string, response: 'confirmed' | 'declined') => void
}) {
  const { t, lang } = useI18n()
  const [discountCode, setDiscountCode] = useState('')
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState(reg.status)
  const [showQrModal, setShowQrModal] = useState(false)

  const ev = reg.events
  if (!ev) return null

  const city = ev.cities?.name ?? ''
  const country = ev.cities?.country ?? ''
  const dateStr = ev.date_start
    ? new Date(ev.date_start).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        day: '2-digit', month: 'long', year: 'numeric',
        timeZone: ev.timezone ?? 'UTC',
      })
    : null

  const isPast = ['closed', 'archived'].includes(ev.status)
  const isConfirmedOrPurchased = ['confirmed', 'purchased'].includes(localStatus)
  const isInvited = localStatus === 'invited'
  const isPending = localStatus === 'pending' || localStatus === 'waitlist'
  const hasPaid = payment?.status === 'approved'
  const hasPayment = reg.paymentAvailable && ev.price && !hasPaid && (isInvited || localStatus === 'confirmed')

  const statusBadge: Record<string, { label: string; color: string }> = {
    invited: { label: lang === 'es' ? 'INVITACIÓN EXCLUSIVA' : 'EXCLUSIVE INVITATION', color: 'rgba(201,168,76,0.7)' },
    confirmed: { label: lang === 'es' ? 'CONFIRMADO' : 'CONFIRMED', color: 'rgba(245,240,232,0.5)' },
    purchased: { label: lang === 'es' ? 'ACCESO CONFIRMADO' : 'ACCESS CONFIRMED', color: 'rgba(72,187,120,0.7)' },
    pending: { label: lang === 'es' ? 'EN REVISIÓN' : 'UNDER REVIEW', color: 'rgba(245,240,232,0.3)' },
    waitlist: { label: lang === 'es' ? 'LISTA DE ESPERA' : 'WAITLIST', color: 'rgba(245,240,232,0.3)' },
    declined: { label: lang === 'es' ? 'DECLINADO' : 'DECLINED', color: 'rgba(245,240,232,0.2)' },
  }
  const badge = statusBadge[localStatus] ?? { label: localStatus, color: 'rgba(245,240,232,0.3)' }

  async function handleRsvp(response: 'confirmed' | 'declined') {
    setRsvpLoading(response)
    try {
      const res = await fetch('/api/cuenta/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp_token: reg.rsvp_token, response }),
      })
      if (res.ok) {
        setLocalStatus(response)
        onRsvp(reg.rsvp_token, response)
      }
    } finally {
      setRsvpLoading(null)
    }
  }

  async function handlePayment() {
    setLoadingPayment(true)
    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: reg.id, discount_code: discountCode || undefined }),
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        alert(data.error ?? 'Error al procesar el pago')
      }
    } finally {
      setLoadingPayment(false)
    }
  }

  // ── Past event: compact card ──
  if (isPast) {
    const attended = ['purchased', 'confirmed'].includes(localStatus)
    return (
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.1)', borderRadius: '12px', overflow: 'hidden', maxWidth: '480px', width: '100%', opacity: 0.55 }}>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase', margin: 0 }}>
              {city}{city && country ? ` · ${country}` : country}
            </p>
            <span style={{
              ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '3px',
              background: attended ? 'rgba(72,187,120,0.08)' : 'rgba(245,240,232,0.04)',
              border: `0.5px solid ${attended ? 'rgba(72,187,120,0.2)' : 'rgba(245,240,232,0.1)'}`,
              color: attended ? 'rgba(72,187,120,0.6)' : 'rgba(245,240,232,0.25)',
            }}>
              {attended ? (lang === 'es' ? 'ASISTIDO' : 'ATTENDED') : (lang === 'es' ? 'REGISTRADO' : 'REGISTERED')}
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '20px', color: 'rgba(245,240,232,0.55)', marginBottom: dateStr ? '4px' : '0', lineHeight: 1.2 }}>
            {ev.name}
          </h3>
          {dateStr && <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.25)', margin: 0 }}>{dateStr}</p>}
          {hasPaid && ev.price && (
            <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.2)', marginTop: '6px' }}>
              {payment?.amount ?? ev.price} {ev.currency}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Active event: full card ──
  return (
    <>
      {showQrModal && (
        <QrModal
          registration={reg}
          event={ev}
          lang={lang}
          onClose={() => setShowQrModal(false)}
        />
      )}

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.18)', borderRadius: '16px', overflow: 'hidden', maxWidth: '480px', width: '100%' }}>

        {/* Pending RSVP band */}
        {isInvited && reg.rsvp_token && (
          <div style={{
            background: 'rgba(201,168,76,0.08)',
            borderBottom: '0.5px solid rgba(201,168,76,0.2)',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <p style={{ ...S, fontSize: '12px', color: 'rgba(201,168,76,0.8)', margin: 0, lineHeight: 1.4 }}>
              {lang === 'es' ? 'Tenés una confirmación pendiente' : 'You have a pending confirmation'}
            </p>
            <button
              onClick={() => handleRsvp('confirmed')}
              disabled={!!rsvpLoading}
              style={{
                ...S, fontSize: '10px', letterSpacing: '0.12em',
                padding: '7px 14px', borderRadius: '4px',
                background: 'rgba(201,168,76,0.1)',
                border: '0.5px solid rgba(201,168,76,0.4)',
                color: '#C9A84C', cursor: 'pointer',
                opacity: rsvpLoading ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {rsvpLoading === 'confirmed' ? '...' : (lang === 'es' ? 'CONFIRMAR AHORA' : 'CONFIRM NOW')}
            </button>
          </div>
        )}

        {/* Cover image */}
        {ev.cover_image && (
          <div style={{ width: '100%', aspectRatio: '16/7', overflow: 'hidden' }}>
            <img src={ev.cover_image} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ padding: '24px' }}>

          {/* Status badge */}
          <p style={{ ...S, fontSize: '10px', letterSpacing: '0.16em', color: badge.color, textTransform: 'uppercase', marginBottom: '8px' }}>
            {badge.label}
          </p>

          {/* City / country */}
          <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
            {city}{city && country ? ` · ${country}` : country}
          </p>

          {/* Event name */}
          <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '26px', color: 'var(--bone)', marginBottom: dateStr ? '4px' : '20px', lineHeight: 1.2 }}>
            {ev.name}
          </h3>

          {/* Date */}
          {dateStr && (
            <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', marginBottom: '20px' }}>{dateStr}</p>
          )}

          {/* Payment pending section */}
          {hasPayment && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(201,168,76,0.05)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '4px 10px', borderRadius: '3px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
                  {t.cuentaPaymentPending}
                </span>
                <span style={{ ...S, fontSize: '16px', color: 'var(--bone)', fontWeight: 300 }}>
                  {ev.price} {ev.currency}
                </span>
              </div>
              <input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder={t.cuentaDiscountPlaceholder}
                style={{ width: '100%', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '10px 12px', color: 'var(--bone)', ...S, fontSize: '13px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }}
              />
              <button
                onClick={handlePayment}
                disabled={loadingPayment}
                style={{
                  width: '100%', padding: '14px',
                  background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.4)',
                  borderRadius: '6px', color: '#C9A84C',
                  ...S, fontSize: '11px', letterSpacing: '0.12em',
                  cursor: loadingPayment ? 'wait' : 'pointer',
                  animation: loadingPayment ? 'accountPulse 1.5s ease-in-out infinite' : 'none',
                }}
              >
                {loadingPayment
                  ? (lang === 'es' ? 'PROCESANDO...' : 'PROCESSING...')
                  : `${t.cuentaCompleteAccess} ${ev.price} ${ev.currency}`
                }
              </button>
            </div>
          )}

          {/* Payment confirmed section */}
          {hasPaid && ev.price && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(72,187,120,0.05)', border: '0.5px solid rgba(72,187,120,0.15)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '4px 10px', borderRadius: '3px', background: 'rgba(72,187,120,0.1)', border: '0.5px solid rgba(72,187,120,0.3)', color: 'rgba(72,187,120,0.9)' }}>
                {t.cuentaPaymentApproved}
              </span>
              <span style={{ ...S, fontSize: '15px', color: 'rgba(72,187,120,0.8)' }}>
                {payment?.amount ?? ev.price} {ev.currency}
              </span>
            </div>
          )}

          {/* Under review */}
          {isPending && (
            <div style={{ marginBottom: '8px' }}>
              <p style={{ ...S, fontSize: '14px', color: 'var(--bone)', marginBottom: '6px' }}>{t.cuentaUnderReview}</p>
              <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{t.cuentaUnderReviewSub}</p>
            </div>
          )}

          {/* Invited: confirm/decline */}
          {isInvited && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleRsvp('confirmed')}
                disabled={!!rsvpLoading}
                style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.4)', borderRadius: '6px', color: '#C9A84C', ...S, fontSize: '13px', letterSpacing: '0.12em', cursor: 'pointer', opacity: rsvpLoading ? 0.6 : 1 }}
              >
                {rsvpLoading === 'confirmed' ? '...' : t.cuentaConfirm}
              </button>
              <button
                onClick={() => handleRsvp('declined')}
                disabled={!!rsvpLoading}
                style={{ width: '100%', padding: '14px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '6px', color: 'rgba(245,240,232,0.4)', ...S, fontSize: '13px', letterSpacing: '0.1em', cursor: 'pointer', opacity: rsvpLoading ? 0.6 : 1 }}
              >
                {rsvpLoading === 'declined' ? '...' : t.cuentaDecline}
              </button>
            </div>
          )}

          {/* Confirmed / purchased: QR + location */}
          {isConfirmedOrPurchased && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                onClick={() => setShowQrModal(true)}
                style={{
                  width: '100%', padding: '14px',
                  background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)',
                  borderRadius: '6px', color: '#C9A84C',
                  ...S, fontSize: '11px', letterSpacing: '0.14em',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 14h2m0 0h2m-2 0v2m0 2v2m2-4h2m-2 2h2" />
                </svg>
                {lang === 'es' ? 'MOSTRAR QR DE ACCESO' : 'SHOW ACCESS QR'}
              </button>

              {ev.secret_location ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', paddingTop: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A84C', display: 'inline-block', flexShrink: 0, animation: 'accountPulseDot 2s ease-in-out infinite' }} />
                  <span style={{ ...S, fontSize: '12px', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.1em' }}>
                    {t.cuentaSecretLocation}
                  </span>
                </div>
              ) : ev.location_address ? (
                <div style={{ textAlign: 'center', borderTop: '0.5px solid rgba(201,168,76,0.1)', paddingTop: '16px' }}>
                  <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)', marginBottom: '8px' }}>
                    {ev.location_name ?? ev.location_address}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(ev.location_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...S, fontSize: '11px', color: 'rgba(201,168,76,0.7)', textDecoration: 'none', letterSpacing: '0.08em' }}
                  >
                    {t.cuentaViewMaps} →
                  </a>
                </div>
              ) : null}
            </div>
          )}

          {localStatus === 'declined' && (
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.35)' }}>
              {lang === 'es' ? 'No asistirás a este evento.' : "You won't be attending this event."}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Account Content ──────────────────────────────────────────────────────────

interface Props {
  registrations: any[]
  payments: any[]
}

export function AccountContent({ registrations, payments }: Props) {
  const { t, lang } = useI18n()
  const [regs, setRegs] = useState(registrations)
  const [selectedCity, setSelectedCity] = useState<string>('all')

  const paymentByReg = payments.reduce((acc: any, p: any) => {
    if (!acc[p.registration_id] || p.status === 'approved') {
      acc[p.registration_id] = p
    }
    return acc
  }, {})

  // City filter: only show if user has registrations in multiple cities
  const cities = Array.from(new Set(regs.map((r: any) => r.events?.cities?.name).filter(Boolean))) as string[]
  const showCityFilter = cities.length > 1

  const filteredRegs = selectedCity === 'all'
    ? regs
    : regs.filter((r: any) => r.events?.cities?.name === selectedCity)

  const upcomingRegs = filteredRegs.filter((r: any) => {
    const evStatus = r.events?.status
    return ['active', 'soon'].includes(evStatus ?? '') && r.status !== 'declined'
  })

  const pastRegs = filteredRegs.filter((r: any) => {
    const evStatus = r.events?.status
    return ['closed', 'archived'].includes(evStatus ?? '')
  })

  const firstName = regs[0]?.first_name ?? ''

  function handleRsvp(token: string, response: 'confirmed' | 'declined') {
    setRegs((prev) => prev.map((r: any) => r.rsvp_token === token ? { ...r, status: response } : r))
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: 'var(--bone)' }}>
      {/* Header */}
      <div style={{ padding: '24px clamp(20px,5vw,48px) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          href="/"
          style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.6)', textDecoration: 'none', transition: 'color 200ms' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.6)' }}
        >
          {t.cuentaBack}
        </Link>
        <button
          onClick={handleLogout}
          style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.3)', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 200ms' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.7)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.3)' }}
        >
          {t.cuentaLogout}
        </button>
      </div>

      {/* Greeting */}
      <div style={{ textAlign: 'center', padding: 'clamp(40px,8vw,80px) 24px clamp(24px,5vw,48px)' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(32px,5vw,48px)', color: 'var(--bone)' }}>
          {t.cuentaGreeting} {firstName}.
        </h1>
        <div style={{ width: '60px', height: '0.5px', background: 'rgba(201,168,76,0.5)', margin: '16px auto 0' }} />
      </div>

      {/* City filter pills */}
      {showCityFilter && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', padding: '0 24px 32px' }}>
          {(['all', ...cities] as string[]).map((c) => {
            const active = selectedCity === c
            return (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                style={{
                  ...S, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '8px 18px', borderRadius: '20px', cursor: 'pointer',
                  background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                  border: `0.5px solid ${active ? 'rgba(201,168,76,0.4)' : 'rgba(245,240,232,0.15)'}`,
                  color: active ? '#C9A84C' : 'rgba(245,240,232,0.4)',
                  transition: 'all 150ms ease',
                }}
              >
                {c === 'all' ? (lang === 'es' ? 'TODAS' : 'ALL') : c.toUpperCase()}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 clamp(16px,4vw,40px) 80px', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>

        {filteredRegs.filter((r: any) => r.status !== 'declined').length === 0 && (
          <p style={{ ...S, fontSize: '14px', color: 'rgba(245,240,232,0.4)', textAlign: 'center' }}>
            {lang === 'es' ? 'No tenés registros todavía.' : 'No registrations yet.'}
          </p>
        )}

        {/* Upcoming */}
        {upcomingRegs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            {upcomingRegs.length > 1 && (
              <p style={{ ...S, fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                {t.cuentaUpcoming}
              </p>
            )}
            {upcomingRegs.map((r: any) => (
              <EventCard key={r.id} reg={r} payment={paymentByReg[r.id] ?? null} onRsvp={handleRsvp} />
            ))}
          </div>
        )}

        {/* Past */}
        {pastRegs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(245,240,232,0.25)', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
              {t.cuentaPast}
            </p>
            {pastRegs.map((r: any) => (
              <EventCard key={r.id} reg={r} payment={paymentByReg[r.id] ?? null} onRsvp={handleRsvp} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes accountPulseDot {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes accountPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase-browser'
import { useI18n } from '@/lib/i18n'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

function generateQrToken(registrationId: string) {
  if (typeof window === 'undefined') return ''
  return btoa(JSON.stringify({
    registration_id: registrationId,
    expires: Date.now() + 15 * 60 * 1000,
  }))
}

function QrBlock({ registrationId }: { registrationId: string }) {
  const [token, setToken] = useState(() => generateQrToken(registrationId))
  const { t } = useI18n()

  useEffect(() => {
    const interval = setInterval(() => {
      setToken(generateQrToken(registrationId))
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [registrationId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ padding: '16px', background: '#fff', borderRadius: '12px' }}>
        <QRCodeSVG value={token} size={256} />
      </div>
      <p style={{ ...S, fontSize: '12px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.06em' }}>
        {t.cuentaQrInstructions}
      </p>
    </div>
  )
}

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
  const hasPayment = reg.paymentAvailable && ev.price && isInvited

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

  const cardStyle: React.CSSProperties = {
    background: '#0F0F1A',
    border: '0.5px solid rgba(201,168,76,0.18)',
    borderRadius: '16px',
    overflow: 'hidden',
    maxWidth: '480px',
    width: '100%',
    opacity: isPast ? 0.6 : 1,
  }

  return (
    <div style={cardStyle}>
      {ev.cover_image && !isPast && (
        <div style={{ width: '100%', aspectRatio: '16/7', overflow: 'hidden' }}>
          <img src={ev.cover_image} alt={ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '24px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
          {city}{city && country ? ` · ${country}` : country}
        </p>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '26px', color: 'var(--bone)', marginBottom: dateStr ? '4px' : '16px', lineHeight: 1.2 }}>
          {ev.name}
        </h3>
        {dateStr && (
          <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', marginBottom: '20px' }}>{dateStr}</p>
        )}

        {/* ESTADO: PENDING */}
        {isPending && (
          <div>
            <p style={{ ...S, fontSize: '14px', color: 'var(--bone)', marginBottom: '6px' }}>
              {t.cuentaUnderReview}
            </p>
            <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>
              {t.cuentaUnderReviewSub}
            </p>
          </div>
        )}

        {/* ESTADO: INVITED */}
        {isInvited && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleRsvp('confirmed')}
              disabled={!!rsvpLoading}
              style={{ padding: '14px', background: 'rgba(72,187,120,0.1)', border: '0.5px solid rgba(72,187,120,0.4)', borderRadius: '6px', color: 'rgba(72,187,120,0.9)', ...S, fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer', opacity: rsvpLoading ? 0.6 : 1 }}
            >
              {rsvpLoading === 'confirmed' ? '...' : t.cuentaConfirm}
            </button>
            <button
              onClick={() => handleRsvp('declined')}
              disabled={!!rsvpLoading}
              style={{ padding: '12px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '6px', color: 'rgba(245,240,232,0.4)', ...S, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', opacity: rsvpLoading ? 0.6 : 1 }}
            >
              {rsvpLoading === 'declined' ? '...' : t.cuentaDecline}
            </button>

            {hasPayment && (
              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '0.5px solid rgba(201,168,76,0.1)' }}>
                <input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder={t.cuentaDiscountPlaceholder}
                  style={{ width: '100%', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '10px 12px', color: 'var(--bone)', ...S, fontSize: '13px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <button
                  onClick={handlePayment}
                  disabled={loadingPayment}
                  style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.4)', borderRadius: '6px', color: 'var(--gold)', ...S, fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer', opacity: loadingPayment ? 0.6 : 1 }}
                >
                  {loadingPayment ? '...' : `${t.cuentaCompleteAccess} ${ev.price} ${ev.currency}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ESTADO: CONFIRMED / PURCHASED */}
        {isConfirmedOrPurchased && !isPast && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <QrBlock registrationId={reg.id} />

            {/* Payment badge */}
            {localStatus === 'purchased' && (
              <span style={{
                ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '5px 14px', borderRadius: '3px',
                background: hasPaid ? 'rgba(72,187,120,0.1)' : 'rgba(201,168,76,0.08)',
                border: `0.5px solid rgba(${hasPaid ? '72,187,120' : '201,168,76'},0.3)`,
                color: hasPaid ? 'rgba(72,187,120,0.9)' : 'var(--gold)',
              }}>
                {hasPaid ? t.cuentaPaymentApproved : t.cuentaPaymentPending}
              </span>
            )}

            {/* Location */}
            {ev.secret_location ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C9A84C', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <span style={{ ...S, fontSize: '12px', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.1em' }}>{t.cuentaSecretLocation}</span>
              </div>
            ) : ev.location_address ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)', marginBottom: '8px' }}>{ev.location_name ?? ev.location_address}</p>
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

        {/* ESTADO: DECLINED */}
        {localStatus === 'declined' && (
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.35)' }}>No asistirás a este evento.</p>
        )}
      </div>
    </div>
  )
}

interface Props {
  registrations: any[]
  payments: any[]
}

export function AccountContent({ registrations, payments }: Props) {
  const { t, lang } = useI18n()
  const [regs, setRegs] = useState(registrations)

  const paymentByReg = payments.reduce((acc: any, p: any) => {
    if (!acc[p.registration_id] || p.status === 'approved') {
      acc[p.registration_id] = p
    }
    return acc
  }, {})

  const upcomingRegs = regs.filter((r: any) => {
    const evStatus = r.events?.status
    return ['active', 'soon'].includes(evStatus ?? '') && r.status !== 'declined'
  })

  const pastRegs = regs.filter((r: any) => {
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

      {/* Content */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 clamp(16px,4vw,40px) 80px', display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>

        {regs.length === 0 && (
          <p style={{ ...S, fontSize: '14px', color: 'rgba(245,240,232,0.4)', textAlign: 'center' }}>
            {lang === 'es' ? 'No tenés registros todavía.' : 'No registrations yet.'}
          </p>
        )}

        {/* Upcoming registrations */}
        {upcomingRegs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            {upcomingRegs.length > 1 && (
              <p style={{ ...S, fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                {t.cuentaUpcoming}
              </p>
            )}
            {upcomingRegs.map((r: any) => (
              <EventCard
                key={r.id}
                reg={r}
                payment={paymentByReg[r.id] ?? null}
                onRsvp={handleRsvp}
              />
            ))}
          </div>
        )}

        {/* Past registrations */}
        {pastRegs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(245,240,232,0.25)', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
              {t.cuentaPast}
            </p>
            {pastRegs.map((r: any) => (
              <EventCard
                key={r.id}
                reg={r}
                payment={paymentByReg[r.id] ?? null}
                onRsvp={handleRsvp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Event } from '@/lib/types'
import { RegistrationModal } from '@/components/ui/RegistrationModal'

interface Props {
  event: Event
}

function useCountdown(targetDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!targetDate) return

    function calc() {
      const diff = new Date(targetDate!).getTime() - Date.now()
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      const s = Math.floor(diff / 1000)
      setTimeLeft({
        days: Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        minutes: Math.floor((s % 3600) / 60),
        seconds: s % 60,
      })
    }

    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}

export function EventPageClient({ event }: Props) {
  const { t, lang } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)
  const [preRegName, setPreRegName] = useState('')
  const [preRegEmail, setPreRegEmail] = useState('')
  const [preRegStatus, setPreRegStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const timeLeft = useCountdown(event.status === 'soon' ? event.date_start : null)

  const description = lang === 'en' && event.description_en ? event.description_en : event.description_es

  // Track ref code from URL
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (!ref) return
    sessionStorage.setItem('ref_code', ref)
    fetch('/api/referral-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: ref }),
    }).catch(() => {})
  }, [])

  async function handlePreRegister(e: React.FormEvent) {
    e.preventDefault()
    setPreRegStatus('loading')
    try {
      const res = await fetch('/api/pre-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, first_name: preRegName, email: preRegEmail }),
      })
      setPreRegStatus(res.ok ? 'success' : 'idle')
    } catch {
      setPreRegStatus('idle')
    }
  }

  const S: React.CSSProperties = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <>
      {/* Description */}
      {description && (
        <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(24px, 5vw, 80px)', maxWidth: '760px' }}>
          <p style={{
            fontFamily: 'var(--font-cormorant)', fontWeight: 300,
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: 'rgba(245,240,232,0.8)', lineHeight: 1.85, letterSpacing: '0.02em',
          }}>
            {description}
          </p>
        </section>
      )}

      {/* Dress code */}
      {(event.dress_code || (event.dress_code_images && event.dress_code_images.length > 0)) && (
        <section style={{ padding: '0 clamp(24px, 5vw, 80px) clamp(60px, 8vw, 100px)', maxWidth: '960px' }}>
          <div style={{ borderTop: '0.5px solid rgba(201,168,76,0.08)', paddingTop: '48px' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '20px' }}>
              {t.dressCode}
            </p>
            {event.dress_code && (
              <p style={{
                fontFamily: 'var(--font-cormorant)', fontWeight: 300,
                fontSize: 'clamp(18px, 2.5vw, 22px)', color: 'var(--bone)',
                marginBottom: event.dress_code_images?.length ? '28px' : 0,
              }}>
                {event.dress_code}
              </p>
            )}
            {event.dress_code_images && event.dress_code_images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxWidth: '600px' }}>
                {event.dress_code_images.map((img, i) => (
                  <img key={i} src={img} alt="" style={{
                    width: '100%', aspectRatio: '1', objectFit: 'cover',
                    borderRadius: '4px', border: '0.5px solid rgba(201,168,76,0.12)',
                  }} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Countdown + pre-register for 'soon' */}
      {event.status === 'soon' && (
        <section style={{ padding: 'clamp(60px, 10vw, 120px) clamp(24px, 5vw, 80px)', textAlign: 'center', background: 'rgba(201,168,76,0.02)', borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
          {event.date_start && (
            <div style={{ marginBottom: '72px' }}>
              <p style={{ ...S, fontSize: '9px', letterSpacing: '0.24em', color: 'rgba(201,168,76,0.45)', textTransform: 'uppercase', marginBottom: '48px' }}>
                FALTAN
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 'clamp(24px, 6vw, 72px)' }}>
                {[
                  { value: timeLeft.days, label: t.countdown.days },
                  { value: timeLeft.hours, label: t.countdown.hours },
                  { value: timeLeft.minutes, label: t.countdown.minutes },
                  { value: timeLeft.seconds, label: t.countdown.seconds },
                ].map(({ value, label }, idx) => (
                  <div key={label}>
                    {/* Separator */}
                    {idx > 0 && (
                      <span style={{
                        position: 'absolute',
                        fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px, 8vw, 88px)',
                        color: 'rgba(201,168,76,0.2)', lineHeight: 1,
                        marginLeft: `clamp(-36px, -9vw, -108px)`,
                        marginTop: '0',
                      }}>·</span>
                    )}
                    <span style={{
                      display: 'block',
                      fontFamily: 'var(--font-cormorant)', fontWeight: 300,
                      fontSize: 'clamp(52px, 10vw, 100px)',
                      color: 'var(--bone)', lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {String(value).padStart(2, '0')}
                    </span>
                    <span style={{ ...S, fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(201,168,76,0.45)', display: 'block', marginTop: '12px', textTransform: 'uppercase' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pre-register form */}
          <div style={{ maxWidth: '380px', margin: '0 auto' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(17px, 2vw, 20px)', color: 'rgba(245,240,232,0.55)', marginBottom: '32px' }}>
              {t.preRegisterSubtitle}
            </p>
            {preRegStatus === 'success' ? (
              <p style={{ ...S, fontSize: '13px', color: 'rgba(72,187,120,0.8)', letterSpacing: '0.04em' }}>
                {t.preRegisterSuccess}
              </p>
            ) : (
              <form onSubmit={handlePreRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input
                  value={preRegName}
                  onChange={(e) => setPreRegName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  required
                  style={{ background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(201,168,76,0.25)', padding: '10px 0', color: 'var(--bone)', ...S, fontSize: '14px', outline: 'none', textAlign: 'left' }}
                />
                <input
                  type="email"
                  value={preRegEmail}
                  onChange={(e) => setPreRegEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                  style={{ background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(201,168,76,0.25)', padding: '10px 0', color: 'var(--bone)', ...S, fontSize: '14px', outline: 'none', textAlign: 'left' }}
                />
                <button
                  type="submit"
                  disabled={preRegStatus === 'loading'}
                  style={{
                    padding: '14px', background: 'rgba(201,168,76,0.08)',
                    border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px',
                    color: 'var(--gold)', ...S, fontWeight: 500, fontSize: '11px',
                    letterSpacing: '0.15em', cursor: 'pointer',
                    opacity: preRegStatus === 'loading' ? 0.6 : 1,
                  }}
                >
                  {preRegStatus === 'loading' ? t.preRegistering : t.preRegister}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Access button for 'active' */}
      {event.status === 'active' && (
        <section style={{ padding: 'clamp(60px, 8vw, 100px) clamp(24px, 5vw, 80px)', textAlign: 'center', borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '12px',
              letterSpacing: '0.2em', color: 'var(--gold)',
              border: '0.5px solid rgba(201,168,76,0.5)',
              background: 'rgba(201,168,76,0.06)', padding: '18px 52px',
              borderRadius: '2px', cursor: 'pointer', transition: 'background 200ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.14)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.06)' }}
          >
            {t.requestAccess}
          </button>
          <RegistrationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} event={event} />
        </section>
      )}
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useI18n } from '@/lib/i18n'

interface Props {
  isOpen: boolean
  onClose: () => void
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '0.5px solid rgba(201,168,76,0.2)',
  padding: '10px 0',
  color: 'var(--bone)',
  fontFamily: 'var(--font-inter)',
  fontWeight: 300,
  fontSize: '13px',
  outline: 'none',
  width: '100%',
  transition: 'border-color 200ms ease',
}

export function SupportModal({ isOpen, onClose }: Props) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [eventRelated, setEventRelated] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
      const supabase = createClient()
      supabase.from('events').select('id, name').in('status', ['active', 'soon']).order('name').then(({ data }) => {
        setEvents(data ?? [])
      })
    } else {
      document.body.style.overflow = ''
      setTimeout(() => {
        setMounted(false)
        setStatus('idle')
        setName('')
        setEmail('')
        setEventRelated('')
        setMessage('')
      }, 350)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) return
    setStatus('loading')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, event_related: eventRelated || null }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (!mounted && !isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-end justify-center z-[8500] px-4 py-6 md:items-center"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 350ms ease',
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#0F0F1A',
          border: '0.5px solid rgba(201,168,76,0.25)',
          borderRadius: '16px',
          padding: 'clamp(24px,5vw,36px) clamp(20px,5vw,40px)',
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1), opacity 350ms ease',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', width: '28px', height: '28px',
            border: '0.5px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.04)',
            borderRadius: '50%', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 200ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: 'var(--bone)', marginBottom: '4px' }}>
          {t.supportTitle}
        </h2>
        <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.6)', marginBottom: '24px' }}>
          {t.supportSubtitle}
        </p>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(72,187,120,0.1)', border: '0.5px solid rgba(72,187,120,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(72,187,120,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '13px', color: 'rgba(245,240,232,0.8)' }}>
              {t.supportSent}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{t.supportName}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{t.supportEmail}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{t.supportEvent}</label>
              <select value={eventRelated} onChange={(e) => setEventRelated(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', background: 'transparent', color: eventRelated ? 'var(--bone)' : 'rgba(245,240,232,0.3)', cursor: 'pointer' }}>
                <option value="">—</option>
                <option value="General">{t.supportEventGeneral}</option>
                {events.map((ev) => <option key={ev.id} value={ev.name}>{ev.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{t.supportMessage}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                style={{
                  background: 'transparent', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px',
                  padding: '10px 12px', color: 'var(--bone)', fontFamily: 'var(--font-inter)',
                  fontWeight: 300, fontSize: '13px', outline: 'none', width: '100%',
                  resize: 'vertical', transition: 'border-color 200ms', boxSizing: 'border-box',
                }}
              />
            </div>
            {status === 'error' && (
              <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', color: '#e57373' }}>
                Ocurrió un error. Por favor intentá de nuevo.
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '14px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '4px', color: 'var(--gold)', fontFamily: 'var(--font-inter)',
                fontWeight: 500, fontSize: '11px', letterSpacing: '0.15em',
                opacity: status === 'loading' ? 0.6 : 1, cursor: 'pointer', transition: 'background 200ms',
              }}
              onMouseEnter={(e) => { if (status !== 'loading') (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.18)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)' }}
            >
              {status === 'loading' ? t.supportSending : t.supportSend}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

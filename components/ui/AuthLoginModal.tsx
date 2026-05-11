'use client'

import { useState, useEffect } from 'react'
import { useAuthModal } from '@/lib/auth-modal-context'
import { useI18n } from '@/lib/i18n'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

export default function AuthLoginModal() {
  const { isOpen, closeModal } = useAuthModal()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setSent(false)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeModal])

  if (!isOpen) return null

  async function handleSend() {
    if (!email || !email.includes('@')) {
      setError('Ingresá un email válido')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSent(true)
      } else if (res.status === 404) {
        setError('No encontramos este email. ¿Querés registrarte a un evento?')
      } else {
        setError(data.error || 'No pudimos enviar el link. Intentá de nuevo.')
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'authModalFadeIn 200ms ease',
      }}
      onClick={closeModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0F0F1A',
          border: '0.5px solid rgba(201,168,76,0.25)',
          borderRadius: '16px',
          padding: 'clamp(28px,5vw,40px)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <button
          onClick={closeModal}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(245,240,232,0.4)', fontSize: '20px', lineHeight: 1,
            padding: '4px 8px',
          }}
        >
          ×
        </button>

        <p style={{ ...S, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '20px' }}>
          ONLY MEMBERS
        </p>

        {sent ? (
          <>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '26px', color: '#F5F0E8', marginBottom: '12px' }}>
              Revisá tu email.
            </h2>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.6)', lineHeight: 1.6, marginBottom: '28px' }}>
              El link llega en segundos.
            </p>
            <button
              onClick={closeModal}
              style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '8px', color: '#C9A84C', ...S, fontSize: '11px', letterSpacing: '0.14em', cursor: 'pointer' }}
            >
              CERRAR
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '24px', color: '#F5F0E8', marginBottom: '10px', letterSpacing: '0.04em' }}>
              {t.loginTitle}
            </h2>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6, marginBottom: '24px' }}>
              {t.loginSubtitle}
            </p>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              autoFocus
              style={{
                width: '100%', padding: '12px 16px',
                background: 'transparent',
                border: '0.5px solid rgba(201,168,76,0.3)',
                borderRadius: '8px',
                color: '#F5F0E8', caretColor: '#C9A84C',
                ...S, fontSize: '14px',
                outline: 'none', marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ ...S, color: 'rgba(229,115,115,0.9)', fontSize: '12px', marginBottom: '12px', lineHeight: 1.5, textAlign: 'left' }}>
                {error}
              </p>
            )}
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(201,168,76,0.08)',
                border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '8px', color: '#C9A84C',
                ...S, fontSize: '11px', letterSpacing: '0.14em',
                cursor: sending ? 'wait' : 'pointer',
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? t.loginSending : t.loginSend}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes authModalFadeIn { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }`}</style>
    </div>
  )
}

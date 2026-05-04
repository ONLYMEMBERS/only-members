'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function AuthHandler() {
  const router = useRouter()
  const { session } = useAuth()
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')

  // Run once on mount — detect URL signals
  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)

    if (hash.includes('access_token')) {
      router.replace('/auth/callback' + hash)
      return
    }

    if (hash.includes('error=access_denied') || hash.includes('otp_expired')) {
      window.history.replaceState(null, '', window.location.pathname)
      setShowExpiredModal(true)
      return
    }

    if (params.get('auth_error') === 'expired') {
      window.history.replaceState(null, '', window.location.pathname)
      setShowExpiredModal(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When session arrives and hash still has token, redirect
  useEffect(() => {
    if (session && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname)
      router.push('/cuenta')
    }
  }, [session, router])

  async function handleResend() {
    if (!email || !email.includes('@')) {
      setSendError('Ingresá un email válido')
      return
    }
    setSending(true)
    setSendError('')
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSent(true)
      } else {
        setSendError(data.error || 'No pudimos enviar el link. Intentá de nuevo.')
      }
    } catch {
      setSendError('Error de conexión. Intentá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  if (!showExpiredModal) return null

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={() => setShowExpiredModal(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0F0F1A',
          border: '0.5px solid rgba(201,168,76,0.25)',
          borderRadius: '16px',
          padding: 'clamp(28px, 5vw, 48px)',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <p style={{ ...S, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '20px' }}>
          ONLY MEMBERS
        </p>

        {sent ? (
          <>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '24px', color: '#F5F0E8', marginBottom: '12px' }}>
              Link enviado.
            </h2>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.6)', lineHeight: 1.6, marginBottom: '24px' }}>
              Revisá tu email para acceder a tu cuenta.
            </p>
            <button
              onClick={() => setShowExpiredModal(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '8px', color: '#C9A84C', ...S, fontSize: '11px', letterSpacing: '0.14em', cursor: 'pointer' }}
            >
              CERRAR
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '24px', color: '#F5F0E8', marginBottom: '12px' }}>
              Tu link expiró.
            </h2>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.6)', marginBottom: '24px', lineHeight: 1.6 }}>
              Ingresá tu email y te enviamos un nuevo link de acceso.
            </p>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResend()}
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
            {sendError && (
              <p style={{ ...S, color: '#e57373', fontSize: '12px', marginBottom: '10px' }}>
                {sendError}
              </p>
            )}
            <button
              onClick={handleResend}
              disabled={sending}
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(201,168,76,0.08)',
                border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '8px', color: '#C9A84C',
                ...S, fontSize: '11px', letterSpacing: '0.14em',
                cursor: sending ? 'wait' : 'pointer',
                opacity: sending ? 0.6 : 1,
                marginBottom: '12px',
              }}
            >
              {sending ? 'ENVIANDO...' : 'REENVIAR LINK DE ACCESO'}
            </button>
            <button
              onClick={() => setShowExpiredModal(false)}
              style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

export function AuthErrorHandler() {
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('error=access_denied') || hash.includes('error_code=otp_expired')) {
      window.history.replaceState(null, '', window.location.pathname)
      setShow(true)
    }
  }, [])

  if (!show) return null

  async function handleResend() {
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#0F0F1A',
        border: '0.5px solid rgba(201,168,76,0.2)',
        borderRadius: '16px',
        padding: 'clamp(28px, 5vw, 48px)',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}>
        <p style={{ ...S, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '20px' }}>
          ONLY MEMBERS
        </p>

        {sent ? (
          <>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '24px', color: 'var(--bone)', marginBottom: '12px' }}>
              Link enviado.
            </h2>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.45)', lineHeight: 1.6 }}>
              Revisá tu email. El link expira en 10 minutos.
            </p>
            <button
              onClick={() => setShow(false)}
              style={{ marginTop: '24px', ...S, fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '24px', color: 'var(--bone)', marginBottom: '12px' }}>
              Tu link expiró.
            </h2>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.45)', marginBottom: '28px', lineHeight: 1.6 }}>
              Ingresá tu email y te enviamos un nuevo link de acceso.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResend()}
              placeholder="Correo electrónico"
              style={{
                width: '100%', background: 'transparent',
                border: '0.5px solid rgba(201,168,76,0.25)',
                borderRadius: '4px', padding: '12px 14px',
                color: 'var(--bone)', ...S, fontSize: '13px',
                outline: 'none', marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleResend}
              disabled={sending || !email.trim()}
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(201,168,76,0.08)',
                border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '6px', color: 'var(--gold)',
                ...S, fontSize: '11px', letterSpacing: '0.14em',
                cursor: 'pointer',
                opacity: (sending || !email.trim()) ? 0.5 : 1,
              }}
            >
              {sending ? 'ENVIANDO...' : 'REENVIAR LINK DE ACCESO'}
            </button>
            <button
              onClick={() => setShow(false)}
              style={{ marginTop: '16px', ...S, fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PagoErrorPage({ searchParams }: { searchParams: { reg?: string } }) {
  const regId = searchParams.reg
  const [loading, setLoading] = useState(false)

  async function handleRetry() {
    if (!regId) return
    setLoading(true)
    try {
      const res = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: regId }),
      })
      const data = await res.json()
      if (data.init_point) window.location.href = data.init_point
      else alert(data.error ?? 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(229,62,62,0.08)', border: '0.5px solid rgba(229,62,62,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(229,62,62,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>

      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(28px,5vw,40px)', color: 'var(--bone)', marginBottom: '12px' }}>
        Algo salió mal con el pago.
      </h1>
      <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '14px', color: 'rgba(245,240,232,0.5)', marginBottom: '40px', maxWidth: '360px' }}>
        No te preocupes, podés intentar de nuevo. Tu reserva sigue activa.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        {regId && (
          <button
            onClick={handleRetry}
            disabled={loading}
            style={{
              padding: '14px 32px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.4)',
              borderRadius: '6px', color: 'var(--gold)', fontFamily: 'var(--font-inter)',
              fontWeight: 500, fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '...' : 'INTENTAR DE NUEVO'}
          </button>
        )}
        <Link
          href="/cuenta"
          style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.4)', textDecoration: 'none', letterSpacing: '0.06em' }}
        >
          Volver a mi cuenta
        </Link>
      </div>
    </div>
  )
}

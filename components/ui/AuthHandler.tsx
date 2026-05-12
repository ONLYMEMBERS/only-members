'use client'

import { useEffect, useState } from 'react'
import { useAuthModal } from '@/lib/auth-modal-context'

export default function AuthHandler() {
  const { openModal: openLoginModal } = useAuthModal()
  const [showExpiredModal, setShowExpiredModal] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)

    if (hash.includes('error=access_denied') || hash.includes('otp_expired')) {
      window.history.replaceState(null, '', window.location.pathname)
      setShowExpiredModal(true)
      return
    }

    if (params.get('auth_error') === 'expired') {
      window.history.replaceState(null, '', window.location.pathname)
      setShowExpiredModal(true)
      return
    }

    if (params.get('login') === 'true') {
      window.history.replaceState(null, '', window.location.pathname)
      openLoginModal()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '24px', color: '#F5F0E8', marginBottom: '12px' }}>
          El link expiró.
        </h2>
        <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.6)', marginBottom: '24px', lineHeight: 1.6 }}>
          Este link ya no es válido. Podés ingresar a tu cuenta desde la página de acceso.
        </p>
        <a
          href="/cuenta"
          style={{
            display: 'block', width: '100%', padding: '14px',
            background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)',
            borderRadius: '8px', color: '#C9A84C', ...S, fontSize: '11px', letterSpacing: '0.14em',
            textDecoration: 'none', boxSizing: 'border-box',
          }}
        >
          IR A MI CUENTA
        </a>
      </div>
    </div>
  )
}

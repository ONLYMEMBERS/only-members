'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const
const GOLD = '#C9A84C'

export default function NuevaContrasena() {
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenValid(true)
      } else if (session && tokenValid !== true) {
        setTokenValid(true)
      }
    })

    // Fallback: check session after delay (gives Supabase time to process hash token)
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setTokenValid(prev => prev === true ? true : !!session)
    }, 1000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdate() {
    if (!password) { setError('Ingresá tu nueva contraseña'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError('No pudimos actualizar la contraseña. El link puede haber expirado.')
      } else {
        setSuccess(true)
        await supabase.auth.signOut()
        setTimeout(() => router.push('/cuenta'), 2500)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'transparent',
    border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '8px',
    color: '#F5F0E8', caretColor: GOLD, ...S, fontSize: '14px',
    outline: 'none', boxSizing: 'border-box' as const,
  }
  const wrapper: React.CSSProperties = {
    minHeight: '100vh', background: '#0A0A0F', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '24px',
  }
  const card: React.CSSProperties = {
    maxWidth: '400px', width: '100%', background: '#0F0F1A',
    border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '16px',
    padding: 'clamp(28px,5vw,40px)', textAlign: 'center',
  }
  const brandLabel: React.CSSProperties = {
    ...S, fontSize: '9px', letterSpacing: '0.2em',
    color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '20px',
  }

  if (tokenValid === null) {
    return (
      <div style={wrapper}>
        <div style={card}>
          <p style={brandLabel}>ONLY MEMBERS</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '26px', color: '#F5F0E8', marginBottom: '12px' }}>
            Verificando...
          </h2>
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)' }}>
            Procesando tu link de recuperación.
          </p>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div style={wrapper}>
        <div style={card}>
          <p style={brandLabel}>ONLY MEMBERS</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '26px', color: '#F5F0E8', marginBottom: '12px' }}>
            El link expiró.
          </h2>
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6, marginBottom: '24px' }}>
            Los links de recuperación expiran por seguridad. Solicitá uno nuevo.
          </p>
          <a
            href="/cuenta"
            style={{ display: 'block', width: '100%', padding: '14px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '8px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.14em', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
          >
            SOLICITAR NUEVO LINK
          </a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={wrapper}>
        <div style={card}>
          <p style={brandLabel}>ONLY MEMBERS</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '28px', color: '#F5F0E8', marginBottom: '12px' }}>
            Contraseña actualizada.
          </h2>
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)' }}>
            Redirigiendo a tu cuenta...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <div style={card}>
        <p style={brandLabel}>ONLY MEMBERS</p>
        <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '28px', color: '#F5F0E8', marginBottom: '8px', letterSpacing: '0.02em' }}>
          NUEVA CONTRASEÑA
        </h2>
        <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6, marginBottom: '28px' }}>
          Ingresá tu nueva contraseña para Only Members.
        </p>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, padding: '12px 44px 12px 16px' }}
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.4)', padding: '4px', display: 'flex' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {showPwd
                ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
              }
            </svg>
          </button>
        </div>

        <input
          type={showPwd ? 'text' : 'password'}
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
          style={{ ...inputStyle, padding: '12px 16px', marginBottom: '12px' }}
        />

        {error && (
          <p style={{ ...S, color: 'rgba(229,115,115,0.9)', fontSize: '12px', marginBottom: '12px', textAlign: 'left' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleUpdate}
          disabled={loading || password.length < 8 || password !== confirmPassword}
          style={{ width: '100%', padding: '14px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '8px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.14em', cursor: loading ? 'wait' : 'pointer', opacity: (loading || password.length < 8 || password !== confirmPassword) ? 0.5 : 1 }}
        >
          {loading ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
        </button>
      </div>
    </div>
  )
}

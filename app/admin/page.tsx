'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError('Credenciales incorrectas.'); return }
      router.push('/admin/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'page-fade-in 600ms ease forwards',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', letterSpacing: '0.22em', color: '#F5F0E8', marginBottom: '6px' }}>
            ONLY MEMBERS
          </p>
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.28em', color: '#C9A84C' }}>
            ADMIN
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '0.5px solid rgba(201,168,76,0.25)',
                padding: '10px 0',
                color: '#F5F0E8',
                fontFamily: 'var(--font-inter)',
                fontWeight: 300,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '0.5px solid rgba(201,168,76,0.25)',
                padding: '10px 0',
                color: '#F5F0E8',
                fontFamily: 'var(--font-inter)',
                fontWeight: 300,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: '#e57373' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              background: 'rgba(201,168,76,0.08)',
              border: '0.5px solid rgba(201,168,76,0.35)',
              borderRadius: '4px',
              color: '#C9A84C',
              fontFamily: 'var(--font-inter)',
              fontWeight: 500,
              fontSize: '11px',
              letterSpacing: '0.15em',
              opacity: loading ? 0.6 : 1,
              transition: 'background 200ms',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.16)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)' }}
          >
            {loading ? 'INGRESANDO...' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  )
}

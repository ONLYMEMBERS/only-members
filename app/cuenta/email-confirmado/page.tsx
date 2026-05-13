'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const GOLD = '#C9A84C'
const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

export default function EmailConfirmado() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleConfirmation = async () => {
      // Give Supabase a moment to process the URL hash/token
      await new Promise((r) => setTimeout(r, 800))
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Sign out so user needs to log in manually
        await supabase.auth.signOut()
        setStatus('success')
        setTimeout(() => router.push('/cuenta?tab=login&confirmed=true'), 3000)
      } else {
        setStatus('error')
      }
    }
    handleConfirmation()
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <p style={{
          ...S, fontSize: '10px', letterSpacing: '0.15em',
          color: GOLD, marginBottom: '32px',
        }}>ONLY MEMBERS</p>

        {status === 'loading' && (
          <>
            <div style={{
              width: '36px', height: '36px', margin: '0 auto 16px',
              border: '0.5px solid rgba(201,168,76,0.2)',
              borderTop: `0.5px solid ${GOLD}`,
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ ...S, color: 'rgba(245,240,232,0.4)', fontSize: '13px' }}>
              Verificando...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h2 style={{
              fontFamily: 'var(--font-cormorant)', fontWeight: 300,
              fontSize: '28px', color: '#F5F0E8', marginBottom: '8px',
            }}>
              Email confirmado.
            </h2>
            <p style={{
              ...S, fontSize: '13px',
              color: 'rgba(245,240,232,0.6)', marginBottom: '24px',
            }}>
              Tu cuenta está activa. Redirigiendo al inicio de sesión...
            </p>
            <button
              onClick={() => router.push('/cuenta?tab=login&confirmed=true')}
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(201,168,76,0.08)',
                border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '8px', color: GOLD,
                ...S, fontSize: '11px', fontWeight: 500,
                letterSpacing: '0.15em', cursor: 'pointer',
              }}>
              IR A INICIAR SESIÓN
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{
              fontFamily: 'var(--font-cormorant)', fontWeight: 300,
              fontSize: '26px', color: '#F5F0E8', marginBottom: '8px',
            }}>
              Link inválido o expirado.
            </h2>
            <p style={{
              ...S, fontSize: '13px',
              color: 'rgba(245,240,232,0.6)', marginBottom: '24px',
            }}>
              Solicitá un nuevo link de confirmación.
            </p>
            <button
              onClick={() => router.push('/cuenta')}
              style={{
                width: '100%', padding: '14px',
                background: 'rgba(201,168,76,0.08)',
                border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '8px', color: GOLD,
                ...S, fontSize: '11px', cursor: 'pointer',
              }}>
              VOLVER
            </button>
          </>
        )}
      </div>
    </div>
  )
}

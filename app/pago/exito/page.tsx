import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-admin'
import { QRExito } from './QRExito'

export const dynamic = 'force-dynamic'

export default async function PagoExitoPage({ searchParams }: { searchParams: { reg?: string } }) {
  const regId = searchParams.reg
  let reg: any = null

  if (regId) {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from('registrations')
        .select('id, first_name, last_name, events(name, date_start, cities(name, country))')
        .eq('id', regId)
        .single()
      reg = data
    } catch {}
  }

  const firstName = reg?.first_name ?? ''
  const eventName = reg?.events?.name ?? 'el evento'
  const city = reg?.events?.cities?.name ?? ''
  const dateStr = reg?.events?.date_start
    ? new Date(reg.events.date_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
    }}>
      {/* Success icon */}
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(72,187,120,0.1)', border: '0.5px solid rgba(72,187,120,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(72,187,120,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(28px,5vw,44px)', color: 'var(--bone)', marginBottom: '12px', lineHeight: 1.2 }}>
        Tu acceso está confirmado{firstName ? `, ${firstName}` : ''}.
      </h1>

      <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '14px', color: 'rgba(245,240,232,0.5)', marginBottom: '8px' }}>
        {eventName}
      </p>
      {city && (
        <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(201,168,76,0.5)', marginBottom: dateStr ? '4px' : '32px' }}>
          {city}
        </p>
      )}
      {dateStr && (
        <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.35)', marginBottom: '32px' }}>
          {dateStr}
        </p>
      )}

      {/* QR preview */}
      {regId && <QRExito registrationId={regId} />}

      <Link
        href="/cuenta"
        style={{
          marginTop: '32px', display: 'inline-block', padding: '14px 32px',
          background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.4)',
          borderRadius: '6px', color: 'var(--gold)', fontFamily: 'var(--font-inter)',
          fontWeight: 500, fontSize: '11px', letterSpacing: '0.15em', textDecoration: 'none',
        }}
      >
        VER MI CUENTA
      </Link>
    </div>
  )
}

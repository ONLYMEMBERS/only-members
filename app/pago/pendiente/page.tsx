import Link from 'next/link'

export default function PagoPendientePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>

      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(28px,5vw,40px)', color: 'var(--bone)', marginBottom: '12px' }}>
        Tu pago está en proceso.
      </h1>
      <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '14px', color: 'rgba(245,240,232,0.5)', marginBottom: '40px', maxWidth: '360px' }}>
        Te avisaremos por email cuando se confirme. Puede tomar unos minutos.
      </p>

      <Link
        href="/cuenta"
        style={{
          padding: '14px 32px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)',
          borderRadius: '6px', color: 'var(--gold)', fontFamily: 'var(--font-inter)',
          fontWeight: 500, fontSize: '11px', letterSpacing: '0.15em', textDecoration: 'none',
        }}
      >
        Volver a mi cuenta
      </Link>
    </div>
  )
}

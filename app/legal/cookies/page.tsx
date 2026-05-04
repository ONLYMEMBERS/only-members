import Link from 'next/link'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '11px',
        letterSpacing: '0.14em', color: 'rgba(201,168,76,0.7)',
        textTransform: 'uppercase', marginBottom: '12px',
      }}>
        {title}
      </h2>
      <div style={{ ...S, fontSize: '15px', color: 'rgba(245,240,232,0.8)', lineHeight: 1.9 }}>
        {children}
      </div>
    </div>
  )
}

export default function CookiesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: 'var(--bone)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(20px,5vw,24px)' }}>
        <Link
          href="/"
          style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.6)', textDecoration: 'none', display: 'inline-block', marginBottom: '48px' }}
        >
          ← ONLY MEMBERS
        </Link>

        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(28px,5vw,36px)', color: 'var(--bone)', marginBottom: '8px' }}>
          Política de Cookies
        </h1>
        <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.3)', marginBottom: '48px' }}>
          Última actualización: Mayo 2025
        </p>

        <Section title="1. Qué son las cookies">
          <p>Pequeños archivos que se almacenan en tu dispositivo para mejorar tu experiencia de navegación.</p>
        </Section>

        <Section title="2. Cookies que usamos">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong style={{ fontWeight: 400, color: 'rgba(245,240,232,0.9)' }}>Cookies de sesión (Supabase Auth):</strong> necesarias para mantener tu sesión iniciada. Sin ellas no podés acceder a tu cuenta.</li>
            <li><strong style={{ fontWeight: 400, color: 'rgba(245,240,232,0.9)' }}>Cookies de preferencias:</strong> guardan tu idioma preferido (ES/EN).</li>
          </ul>
          <p style={{ marginTop: '12px' }}>Actualmente no usamos cookies de análisis ni publicidad.</p>
        </Section>

        <Section title="3. Cookies de terceros">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong style={{ fontWeight: 400, color: 'rgba(245,240,232,0.9)' }}>Supabase:</strong> gestión de sesiones y autenticación</li>
            <li><strong style={{ fontWeight: 400, color: 'rgba(245,240,232,0.9)' }}>MercadoPago:</strong> procesamiento seguro de pagos</li>
          </ul>
        </Section>

        <Section title="4. Cómo controlarlas">
          <p>Podés configurar tu navegador para rechazar cookies aunque algunas funciones del sitio pueden dejar de funcionar correctamente.</p>
        </Section>

        <Section title="5. Contacto">
          <p><a href="mailto:hola@onlymembers.life" style={{ color: 'rgba(201,168,76,0.7)', textDecoration: 'none' }}>hola@onlymembers.life</a></p>
        </Section>
      </div>
    </div>
  )
}

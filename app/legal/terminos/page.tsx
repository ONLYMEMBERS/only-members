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

export default function TerminosPage() {
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
          Términos y Condiciones
        </h1>
        <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.3)', marginBottom: '48px' }}>
          Última actualización: Mayo 2025
        </p>

        <Section title="1. Aceptación">
          <p>Al registrarte en Only Members aceptás estos términos.</p>
        </Section>

        <Section title="2. El servicio">
          <p>Only Members es un circuito privado de eventos cuyo acceso es por invitación. El registro no garantiza acceso — es una solicitud que evalúa el equipo de Resilio.</p>
        </Section>

        <Section title="3. Proceso de selección">
          <p>Resilio se reserva el derecho de aceptar o rechazar solicitudes sin necesidad de justificación. La selección es discrecional.</p>
        </Section>

        <Section title="4. Pagos">
          <p>Los pagos se procesan a través de MercadoPago. Los precios incluyen impuestos aplicables según el país del evento.</p>
        </Section>

        <Section title="5. Política de reembolso">
          <p>Las entradas no son reembolsables salvo cancelación del evento por parte de Resilio. En caso de cancelación, se reembolsará el 100% del valor abonado en un plazo de 10 días hábiles.</p>
        </Section>

        <Section title="6. Cancelación por parte del organizador">
          <p>Resilio se reserva el derecho de cancelar o reprogramar eventos. En caso de reprogramación, el acceso se traslada a la nueva fecha.</p>
        </Section>

        <Section title="7. Conducta">
          <p>Los asistentes deben respetar las normas del venue y de convivencia. Resilio puede revocar el acceso sin reembolso ante conductas inadecuadas.</p>
        </Section>

        <Section title="8. Propiedad intelectual">
          <p>El contenido de onlymembers.life es propiedad de Resilio. Queda prohibida su reproducción sin autorización.</p>
        </Section>

        <Section title="9. Limitación de responsabilidad">
          <p>Resilio no se responsabiliza por daños indirectos derivados de la participación en los eventos.</p>
        </Section>

        <Section title="10. Jurisdicción">
          <p>Estos términos se rigen por las leyes de la República Argentina. Jurisdicción: Ciudad Autónoma de Buenos Aires.</p>
        </Section>

        <Section title="11. Contacto">
          <p><a href="mailto:hola@onlymembers.life" style={{ color: 'rgba(201,168,76,0.7)', textDecoration: 'none' }}>hola@onlymembers.life</a></p>
        </Section>
      </div>
    </div>
  )
}

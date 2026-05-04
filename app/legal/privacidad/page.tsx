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

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.3)', marginBottom: '48px' }}>
          Última actualización: Mayo 2025
        </p>

        <Section title="1. Quiénes somos">
          <p>Resilio, operador de Only Members, circuito internacional de eventos privados. Dominio: onlymembers.life</p>
        </Section>

        <Section title="2. Datos que recolectamos">
          <p>Al registrarte a un evento recolectamos: nombre y apellido, email, teléfono, país, ciudad, DNI o documento de identidad, género, perfil de Instagram.</p>
          <p style={{ marginTop: '12px' }}>Al realizar un pago: datos de transacción procesados por MercadoPago. No almacenamos datos de tarjetas de crédito.</p>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Evaluar tu solicitud de acceso al evento</li>
            <li>Enviarte la invitación si sos seleccionado/a</li>
            <li>Gestionar tu acceso y pago</li>
            <li>Comunicaciones relacionadas con el evento</li>
          </ul>
        </Section>

        <Section title="4. Base legal">
          <p>El tratamiento de tus datos se basa en tu consentimiento explícito al completar el formulario de registro, y en la ejecución del contrato de acceso al evento.</p>
        </Section>

        <Section title="5. Compartir datos">
          <p>No vendemos ni compartimos tus datos con terceros salvo:</p>
          <ul style={{ paddingLeft: '20px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>MercadoPago para procesar pagos</li>
            <li>Supabase como proveedor de infraestructura (almacenamiento seguro)</li>
            <li>Resend para envío de emails transaccionales</li>
          </ul>
          <p style={{ marginTop: '12px' }}>Todos los proveedores cumplen con estándares de seguridad internacionales.</p>
        </Section>

        <Section title="6. Retención de datos">
          <p>Conservamos tus datos por el tiempo necesario para cumplir los fines descritos o según lo requieran obligaciones legales (máximo 5 años).</p>
        </Section>

        <Section title="7. Tus derechos">
          <p>Tenés derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos (derechos ARCO). Para ejercerlos escribinos a: hola@onlymembers.life</p>
          <p style={{ marginTop: '12px' }}>Ley aplicable: Ley 25.326 de Protección de Datos Personales (Argentina) y GDPR (Reglamento Europeo) para usuarios de la Unión Europea.</p>
        </Section>

        <Section title="8. Seguridad">
          <p>Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o divulgación.</p>
        </Section>

        <Section title="9. Contacto">
          <p>Para consultas sobre privacidad: <a href="mailto:hola@onlymembers.life" style={{ color: 'rgba(201,168,76,0.7)', textDecoration: 'none' }}>hola@onlymembers.life</a></p>
        </Section>
      </div>
    </div>
  )
}

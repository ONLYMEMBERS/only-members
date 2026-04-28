import { notFound } from 'next/navigation'
import Link from 'next/link'

const VALID = ['confirmed', 'declined', 'invalid']

export default function RsvpPage({ params }: { params: { response: string } }) {
  const { response } = params
  if (!VALID.includes(response)) notFound()

  const confirmed = response === 'confirmed'
  const declined = response === 'declined'

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0A0A0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        animation: 'page-fade-in 800ms ease forwards',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: '64px' }}>
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: '12px',
            letterSpacing: '0.28em',
            color: 'rgba(245,240,232,0.5)',
          }}
        >
          ONLY MEMBERS
        </span>
      </div>

      {/* Icon */}
      <div style={{ marginBottom: '36px' }}>
        {confirmed && (
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25.5" stroke="rgba(201,168,76,0.3)" />
            <path
              d="M16 26L22 32L36 18"
              stroke="#C9A84C"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {declined && (
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25.5" stroke="rgba(245,240,232,0.12)" />
            <path
              d="M20 26h12"
              stroke="rgba(245,240,232,0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {!confirmed && !declined && (
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25.5" stroke="rgba(245,240,232,0.08)" />
            <path
              d="M26 18v12M26 34v1"
              stroke="rgba(245,240,232,0.2)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 300,
          fontSize: 'clamp(28px, 5vw, 40px)',
          color: confirmed ? '#F5F0E8' : 'rgba(245,240,232,0.6)',
          letterSpacing: '0.04em',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        {confirmed && 'Tu asistencia ha sido confirmada.'}
        {declined && 'Hasta la próxima.'}
        {!confirmed && !declined && 'Enlace no válido.'}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 300,
          fontSize: '14px',
          color: 'rgba(245,240,232,0.38)',
          letterSpacing: '0.03em',
          textAlign: 'center',
          maxWidth: '360px',
          lineHeight: 1.7,
        }}
      >
        {confirmed && 'Nos vemos pronto. Recibirás los detalles del evento por correo.'}
        {declined && 'Esperamos verte en la próxima edición.'}
        {!confirmed && !declined && 'El enlace de RSVP no existe o ya fue usado.'}
      </p>

      {/* Divider */}
      <div
        style={{
          width: '32px',
          height: '0.5px',
          background: 'rgba(201,168,76,0.25)',
          margin: '40px auto',
        }}
      />

      {/* Back link */}
      <Link
        href="/"
        style={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 300,
          fontSize: '10px',
          letterSpacing: '0.18em',
          color: 'rgba(201,168,76,0.5)',
          textDecoration: 'none',
          textTransform: 'uppercase',
          transition: 'color 200ms',
        }}
      >
        VOLVER AL INICIO
      </Link>
    </main>
  )
}

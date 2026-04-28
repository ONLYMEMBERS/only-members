import {
  Html, Body, Container, Heading, Text, Hr, Section, Preview,
} from '@react-email/components'
import React from 'react'

interface Props {
  firstName: string
  eventName: string
  city: string
  country: string
  dateStart: string | null
  language?: string
}

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export function ConfirmationEmail({ firstName, eventName, city, country, dateStart, language = 'es' }: Props) {
  const es = language !== 'en'

  return (
    <Html lang={language}>
      <Preview>{es ? `Tu solicitud para ${eventName} fue recibida` : `Your request for ${eventName} has been received`}</Preview>
      <Body style={{ background: '#0A0A0F', margin: 0, padding: '40px 0' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>

          {/* Header */}
          <Section style={{ borderBottom: '0.5px solid rgba(201,168,76,0.2)', paddingBottom: '24px', marginBottom: '32px' }}>
            <Text style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: '13px', letterSpacing: '0.22em', color: '#F5F0E8', margin: 0 }}>
              ONLY MEMBERS
            </Text>
          </Section>

          {/* Greeting */}
          <Heading style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: '28px', color: '#F5F0E8', lineHeight: 1.3, marginBottom: '16px' }}>
            {es ? `Hola, ${firstName}.` : `Hello, ${firstName}.`}
          </Heading>

          {/* Body text */}
          <Text style={{ fontFamily: 'Arial, sans-serif', fontWeight: 300, fontSize: '15px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.8, marginBottom: '24px' }}>
            {es
              ? `Tu solicitud para `
              : `Your request for `}
            <strong style={{ color: '#C9A84C' }}>{eventName}</strong>
            {es
              ? ` fue recibida. Nos pondremos en contacto contigo si eres seleccionado/a para ser parte de Only Members.`
              : ` has been received. We will reach out if you are selected to be part of Only Members.`}
          </Text>

          {/* Event info */}
          <Section style={{ background: 'rgba(201,168,76,0.05)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '8px', padding: '20px 24px', marginBottom: '32px' }}>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontWeight: 300, fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(201,168,76,0.7)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              {es ? 'EVENTO' : 'EVENT'}
            </Text>
            <Text style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: '20px', color: '#F5F0E8', margin: '0 0 4px 0' }}>
              {eventName}
            </Text>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.5)', margin: 0 }}>
              {city} · {country}{dateStart ? ` · ${formatDate(dateStart)}` : ''}
            </Text>
          </Section>

          <Hr style={{ border: 'none', borderTop: '0.5px solid rgba(201,168,76,0.12)', marginBottom: '24px' }} />

          {/* Footer */}
          <Text style={{ fontFamily: 'Arial, sans-serif', fontWeight: 300, fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(245,240,232,0.35)', margin: 0 }}>
            RESILIO®
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ConfirmationEmail

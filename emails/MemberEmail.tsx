import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Text, Img, Hr,
} from '@react-email/components'

interface Props {
  memberName: string
  eventName: string
  cityName: string
  eventDate: string
  qrDataUrl: string
}

export function MemberEmail({ memberName, eventName, cityName, eventDate, qrDataUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ background: '#0A0A0F', margin: 0, padding: 0, fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <Text style={{
            fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '0.3em',
            color: '#C9A84C', textAlign: 'center', margin: '0 0 8px',
            textTransform: 'uppercase',
          }}>
            ONLY MEMBERS
          </Text>
          <Hr style={{ borderColor: 'rgba(201,168,76,0.25)', margin: '0 0 32px' }} />

          {/* Member badge */}
          <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-block',
              border: '0.5px solid rgba(201,168,76,0.5)',
              background: 'rgba(201,168,76,0.08)',
              padding: '8px 24px', borderRadius: '4px',
            }}>
              <Text style={{
                fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px',
                letterSpacing: '0.3em', color: '#C9A84C', margin: 0,
                textTransform: 'uppercase',
              }}>
                M E M B E R
              </Text>
            </div>
          </Section>

          {/* Greeting */}
          <Text style={{
            fontFamily: 'Georgia, serif', fontWeight: 300,
            fontSize: '28px', color: '#F5F0E8',
            textAlign: 'center', margin: '0 0 16px',
          }}>
            Hola, {memberName}.
          </Text>

          <Text style={{
            fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px',
            color: 'rgba(245,240,232,0.6)', textAlign: 'center',
            lineHeight: '1.7', margin: '0 0 32px',
          }}>
            Tu acceso como Member a <strong style={{ color: '#F5F0E8' }}>{eventName}</strong>
            {cityName ? ` en ${cityName}` : ''} está confirmado.
            Presentá el código en la entrada.
          </Text>

          {/* Divider */}
          <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-block', width: '80px',
              borderTop: '0.5px solid rgba(201,168,76,0.4)',
            }} />
          </Section>

          {/* QR Code */}
          <Section style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Img
              src={qrDataUrl}
              width={200}
              height={200}
              alt="QR Member"
              style={{
                border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '8px',
                display: 'inline-block',
              }}
            />
          </Section>

          {/* Event info */}
          <Text style={{
            fontFamily: 'Georgia, serif', fontWeight: 300,
            fontSize: '18px', color: '#C9A84C',
            textAlign: 'center', margin: '0 0 4px',
          }}>
            {eventName}
          </Text>
          {(cityName || eventDate) && (
            <Text style={{
              fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px',
              color: 'rgba(245,240,232,0.5)', textAlign: 'center', margin: '0 0 32px',
            }}>
              {cityName}{cityName && eventDate ? ' · ' : ''}{eventDate}
            </Text>
          )}

          <Hr style={{ borderColor: 'rgba(201,168,76,0.1)', margin: '0 0 20px' }} />

          {/* Footer */}
          <Text style={{
            fontFamily: 'Inter, Arial, sans-serif', fontSize: '10px',
            color: 'rgba(245,240,232,0.2)', textAlign: 'center',
            letterSpacing: '0.15em', margin: 0,
          }}>
            RESILIO®
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MemberEmail

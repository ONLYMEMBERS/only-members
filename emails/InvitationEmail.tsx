import {
  Html, Body, Container, Heading, Text, Button, Hr, Section, Preview,
} from '@react-email/components'
import React from 'react'

interface Props {
  firstName: string
  eventName: string
  city: string
  dateStart: string | null
  rsvpToken: string
  language?: string
  customBody?: string
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

export function InvitationEmail({ firstName, eventName, city, dateStart, rsvpToken, language = 'es', customBody }: Props) {
  const es = language !== 'en'
  const declinedUrl = `${siteUrl}/api/rsvp?token=${rsvpToken}&response=declined`

  const dateStr = dateStart
    ? new Date(dateStart).toLocaleDateString(es ? 'es-ES' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  return (
    <Html lang={language}>
      <Preview>{es ? `Estás invitado/a a ${eventName}` : `You are invited to ${eventName}`}</Preview>
      <Body style={{ background: '#0A0A0F', margin: 0, padding: '40px 0' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 24px' }}>

          <Section style={{ borderBottom: '0.5px solid rgba(201,168,76,0.2)', paddingBottom: '24px', marginBottom: '32px' }}>
            <Text style={{ fontFamily: 'Georgia, serif', fontSize: '13px', letterSpacing: '0.22em', color: '#F5F0E8', margin: 0 }}>
              ONLY MEMBERS
            </Text>
          </Section>

          <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>
            {es ? 'INVITACIÓN EXCLUSIVA' : 'EXCLUSIVE INVITATION'}
          </Text>

          <Heading style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: '28px', color: '#F5F0E8', lineHeight: 1.3, marginBottom: '16px' }}>
            {es ? `${firstName}, estás invitado/a.` : `${firstName}, you are invited.`}
          </Heading>

          <Text style={{ fontFamily: 'Arial, sans-serif', fontWeight: 300, fontSize: '15px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.8, marginBottom: '24px' }}>
            {customBody ?? (es
              ? `Has sido seleccionado/a para formar parte de <strong style="color:#C9A84C">${eventName}</strong>.`
              : `You have been selected to be part of <strong style="color:#C9A84C">${eventName}</strong>.`
            )}
          </Text>

          {/* Event info */}
          <Section style={{ background: 'rgba(201,168,76,0.05)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '8px', padding: '20px 24px', marginBottom: '32px' }}>
            <Text style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: '20px', color: '#F5F0E8', margin: '0 0 6px 0' }}>
              {eventName}
            </Text>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.5)', margin: 0 }}>
              {city}{dateStr ? ` · ${dateStr}` : ''}
            </Text>
          </Section>

          {/* CTA buttons */}
          <Section style={{ marginBottom: '32px' }}>
            <Button href={`${siteUrl}/cuenta`} style={{
              display: 'inline-block', padding: '14px 28px', marginRight: '12px',
              background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.5)',
              borderRadius: '3px', color: '#C9A84C',
              fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: '0.12em',
              textDecoration: 'none',
            }}>
              {es ? 'VER MI INVITACIÓN' : 'VIEW MY INVITATION'}
            </Button>
            <Button href={declinedUrl} style={{
              display: 'inline-block', padding: '14px 28px',
              background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)',
              borderRadius: '3px', color: 'rgba(245,240,232,0.4)',
              fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: '0.12em',
              textDecoration: 'none',
            }}>
              {es ? 'NO PUEDO ESTA VEZ' : 'CAN\'T MAKE IT'}
            </Button>
          </Section>

          <Hr style={{ border: 'none', borderTop: '0.5px solid rgba(201,168,76,0.12)', marginBottom: '24px' }} />
          <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(245,240,232,0.35)', margin: 0 }}>
            RESILIO®
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InvitationEmail

import { sendEmail } from './resend'
import React from 'react'
import { ConfirmationEmail } from '@/emails/ConfirmationEmail'
import { InvitationEmail } from '@/emails/InvitationEmail'

export async function sendConfirmationEmail(
  registration: {
    id: string
    first_name: string
    email: string
    language?: string | null
    inviteLink?: string
  },
  event: {
    name: string
    date_start: string | null
    cities?: { name: string; country: string } | null
  }
): Promise<void> {
  const lang = registration.language ?? 'es'
  const cityName = (event.cities as any)?.name ?? ''
  const countryName = (event.cities as any)?.country ?? ''

  const { id: resendId } = await sendEmail({
    to: registration.email,
    subject:
      lang === 'en'
        ? `Your request for ${event.name} has been received`
        : `Tu solicitud para ${event.name} fue recibida`,
    template: React.createElement(ConfirmationEmail, {
      firstName: registration.first_name,
      eventName: event.name,
      city: cityName,
      country: countryName,
      dateStart: event.date_start,
      language: lang,
      inviteLink: registration.inviteLink,
    }),
  })

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createAdminClient } = await import('./supabase-admin')
    const admin = createAdminClient()
    try {
      await admin.from('email_logs').insert({
        registration_id: registration.id,
        type: 'confirmation',
        status: 'sent',
        resend_id: resendId ?? null,
      })
    } catch {}
  }
}

export async function sendInvitationEmails(
  registrations: Array<{
    id: string
    first_name: string
    email: string
    language?: string | null
    rsvp_token: string
  }>,
  event: {
    name: string
    date_start: string | null
    cities?: { name: string } | null
  },
  template: {
    subject_es: string
    subject_en: string
    body_es: string
    body_en: string
  }
): Promise<{ sent: number; errors: number }> {
  let sent = 0
  let errors = 0
  const city = (event.cities as any)?.name ?? ''

  for (const reg of registrations) {
    const lang = reg.language ?? 'es'
    const subject = lang === 'en' ? template.subject_en : template.subject_es
    const customBody = lang === 'en' ? template.body_en : template.body_es

    try {
      await sendEmail({
        to: reg.email,
        subject,
        template: React.createElement(InvitationEmail, {
          firstName: reg.first_name,
          eventName: event.name,
          city,
          dateStart: event.date_start,
          rsvpToken: reg.rsvp_token,
          language: lang,
          customBody,
        }),
      })
      sent++
    } catch {
      errors++
    }
  }

  return { sent, errors }
}

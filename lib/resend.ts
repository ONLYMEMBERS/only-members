import { Resend } from 'resend'
import { render } from '@react-email/render'
import React from 'react'

export function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@onlymembers.life'

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string
  subject: string
  template: React.ReactElement
}): Promise<{ id?: string; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.log('[email:dev]', { to, subject })
    return { id: 'dev-mode' }
  }
  const html = await render(template)
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  })
  if (error) return { error: error.message }
  return { id: data?.id }
}

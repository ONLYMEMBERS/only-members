import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/resend'
import React from 'react'
import { InvitationEmail } from '@/emails/InvitationEmail'

const BATCH_SIZE = 50

function replaceVariables(template: string, data: {
  nombre: string
  apellido: string
  evento: string
  ciudad: string
  fecha: string
  link_compra?: string
}): string {
  return template
    .replace(/\{\{nombre\}\}/g, data.nombre)
    .replace(/\{\{apellido\}\}/g, data.apellido)
    .replace(/\{\{evento\}\}/g, data.evento)
    .replace(/\{\{ciudad\}\}/g, data.ciudad)
    .replace(/\{\{fecha\}\}/g, data.fecha)
    .replace(/\{\{link_compra\}\}/g, data.link_compra ?? '')
}

export async function POST(req: NextRequest) {
  try {
    const { registration_ids, subject_es, subject_en, body_es, body_en } = await req.json()
    if (!registration_ids?.length) {
      return NextResponse.json({ error: 'No hay registros.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

    const { data: regs, error } = await admin
      .from('registrations')
      .select('id, first_name, last_name, email, language, rsvp_token, events(name, date_start, cities(name))')
      .in('id', registration_ids)

    if (error || !regs) {
      return NextResponse.json({ error: 'Error fetching registrations.' }, { status: 500 })
    }

    let sent = 0
    let errors = 0

    for (let i = 0; i < regs.length; i += BATCH_SIZE) {
      const batch = regs.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (reg: any) => {
          const lang = reg.language ?? 'es'
          const event = reg.events
          const city = event?.cities?.name ?? ''
          const dateStr = event?.date_start
            ? new Date(event.date_start).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
            : ''
          const vars = {
            nombre: reg.first_name,
            apellido: reg.last_name,
            evento: event?.name ?? '',
            ciudad: city,
            fecha: dateStr,
          }
          const rawBody = lang === 'en' ? body_en : body_es
          const rawSubject = lang === 'en'
            ? (subject_en ?? `You are invited to ${event?.name}`)
            : (subject_es ?? `Estás invitado/a a ${event?.name}`)
          const customBody = rawBody ? replaceVariables(rawBody, vars) : undefined
          const subject = replaceVariables(rawSubject, vars)

          // Generate magic link so "CONFIRMO ASISTENCIA" logs the user in and leads to /cuenta
          let confirmUrl: string | undefined = undefined
          try {
            const { data: linkData } = await admin.auth.admin.generateLink({
              type: 'magiclink',
              email: reg.email,
              options: { redirectTo: `${siteUrl}/auth/callback` },
            })
            confirmUrl = (linkData as any)?.properties?.action_link ?? undefined
          } catch {
            // fall back to direct RSVP URL defined in email template
          }

          try {
            const { id: resendId } = await sendEmail({
              to: reg.email,
              subject,
              template: React.createElement(InvitationEmail, {
                firstName: reg.first_name,
                eventName: event?.name ?? '',
                city,
                dateStart: event?.date_start ?? null,
                rsvpToken: reg.rsvp_token,
                language: lang,
                customBody: customBody || undefined,
                confirmUrl,
              }),
            })

            try {
              await admin.from('email_logs').insert({
                registration_id: reg.id,
                type: 'invitation',
                status: 'sent',
                resend_id: resendId ?? null,
              })
            } catch {}

            try {
              await admin.from('registrations').update({ status: 'invited' }).eq('id', reg.id)
            } catch {}
            sent++
          } catch {
            errors++
          }
        })
      )
    }

    return NextResponse.json({ sent, errors })
  } catch (err) {
    console.error('send-invitation:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}

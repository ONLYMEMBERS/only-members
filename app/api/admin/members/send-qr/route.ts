import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { memberIds, eventId } = await req.json()
    if (!memberIds?.length || !eventId) {
      return NextResponse.json({ error: 'memberIds y eventId requeridos' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: event } = await admin
      .from('events')
      .select('name, date_start, cities(name)')
      .eq('id', eventId)
      .single()

    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    const results = { sent: 0, errors: 0 }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

    const eventDate = event.date_start
      ? new Date(event.date_start).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      : ''
    const cityName = (event.cities as any)?.name ?? ''

    for (const memberId of memberIds) {
      try {
        const { data: member } = await admin.from('member_list').select('*').eq('id', memberId).single()
        if (!member) { results.errors++; continue }

        const accessUrl = `${siteUrl}/cuenta?email=${encodeURIComponent(member.email)}&member=true`

        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:Georgia,serif">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px">
    <p style="font-family:Arial,sans-serif;font-weight:300;font-size:10px;letter-spacing:0.22em;color:rgba(201,168,76,0.7);text-transform:uppercase;margin-bottom:40px">ONLY MEMBERS</p>

    <div style="text-align:center;margin-bottom:36px">
      <p style="font-size:28px;color:#C9A84C;margin:0 0 8px">♛</p>
      <span style="display:inline-block;padding:4px 16px;border:0.5px solid rgba(201,168,76,0.4);color:#C9A84C;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em">MEMBER</span>
    </div>

    <h1 style="font-weight:300;font-size:32px;color:#F5F0E8;letter-spacing:0.04em;margin:0 0 8px;line-height:1.2">
      ${member.name ?? member.email},
    </h1>
    <p style="font-weight:300;font-size:18px;color:rgba(245,240,232,0.6);margin:0 0 32px;font-style:italic">
      Tu acceso Member está listo.
    </p>

    <div style="border-top:0.5px solid rgba(201,168,76,0.15);border-bottom:0.5px solid rgba(201,168,76,0.15);padding:20px 0;margin-bottom:32px">
      <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.14em;color:rgba(201,168,76,0.6);text-transform:uppercase;margin:0 0 6px">EVENTO</p>
      <p style="font-size:22px;color:#F5F0E8;margin:0 0 4px">${event.name}</p>
      ${cityName ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(245,240,232,0.5);margin:0">${cityName}${eventDate ? ` · ${eventDate}` : ''}</p>` : ''}
    </div>

    <p style="font-family:Arial,sans-serif;font-weight:300;font-size:13px;color:rgba(245,240,232,0.6);line-height:1.6;margin-bottom:28px;text-align:center">
      Tu QR de acceso te espera en tu cuenta personal.
    </p>

    <div style="text-align:center;margin-bottom:40px">
      <a href="${accessUrl}" style="display:inline-block;padding:14px 32px;background:rgba(201,168,76,0.1);border:0.5px solid rgba(201,168,76,0.5);color:#C9A84C;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-decoration:none;text-transform:uppercase">
        ACCEDER A MI QR
      </a>
    </div>

    <p style="font-family:Arial,sans-serif;font-weight:300;font-size:11px;color:rgba(245,240,232,0.25);text-align:center;margin:0">
      Resilio® — Only Members
    </p>
  </div>
</body>
</html>`

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Only Members <noreply@onlymembers.life>',
          to: member.email,
          subject: `Tu acceso Member — ${event.name}`,
          html,
        })

        await admin.from('member_list').update({ qr_sent: true, qr_sent_at: new Date().toISOString() }).eq('id', memberId)

        results.sent++
      } catch (err) {
        console.error('Error sending member email:', err)
        results.errors++
      }
    }

    return NextResponse.json(results)
  } catch (err) {
    console.error('send-qr route:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

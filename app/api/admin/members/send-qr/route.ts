import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import QRCode from 'qrcode'
import { render } from '@react-email/render'
import { MemberEmail } from '@/emails/MemberEmail'

export async function POST(req: NextRequest) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { memberIds, eventId } = await req.json()
    if (!memberIds?.length || !eventId) {
      return NextResponse.json({ error: 'memberIds y eventId requeridos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch event data
    const { data: event } = await admin
      .from('events')
      .select('name, date_start, cities(name)')
      .eq('id', eventId)
      .single()

    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

    const results = { sent: 0, errors: 0 }

    for (const memberId of memberIds) {
      try {
        const { data: member } = await admin
          .from('member_list')
          .select('*')
          .eq('id', memberId)
          .single()

        if (!member) { results.errors++; continue }

        // Generate QR content
        const qrContent = btoa(JSON.stringify({
          type: 'member',
          id: member.id,
          email: member.email,
          name: member.name,
          event_id: member.event_id,
        }))

        // Generate QR image as base64 data URL
        const qrDataUrl = await QRCode.toDataURL(qrContent, {
          width: 280,
          margin: 3,
          color: { dark: '#F5F0E8', light: '#0A0A0F' },
        })

        const eventDate = event.date_start
          ? new Date(event.date_start).toLocaleDateString('es-ES', {
              day: '2-digit', month: 'long', year: 'numeric',
            })
          : ''
        const cityName = (event.cities as any)?.name ?? ''

        const rendered = render(
          MemberEmail({
            memberName: member.name ?? member.email,
            eventName: event.name,
            cityName,
            eventDate,
            qrDataUrl,
          })
        )
        const html: string = rendered instanceof Promise ? await rendered : rendered

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'Only Members <noreply@onlymembers.life>',
          to: member.email,
          subject: `Tu acceso Member — ${event.name}`,
          html,
        })

        // Mark as sent
        await admin
          .from('member_list')
          .update({ qr_sent: true, qr_sent_at: new Date().toISOString() })
          .eq('id', memberId)

        results.sent++
      } catch (err) {
        console.error('Error sending member QR:', err)
        results.errors++
      }
    }

    return NextResponse.json(results)
  } catch (err) {
    console.error('send-qr route:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

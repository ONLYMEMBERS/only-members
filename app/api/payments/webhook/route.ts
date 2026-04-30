import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getMPClient, Payment } from '@/lib/mercadopago'
import { sendEmail } from '@/lib/resend'
import React from 'react'

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchMPPayment(mpPaymentId: string, accessToken?: string) {
  const client = getMPClient(accessToken)
  const paymentClient = new Payment(client)
  return paymentClient.get({ id: mpPaymentId })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (type !== 'payment' || !data?.id) {
      return NextResponse.json({ received: true })
    }

    const mpPaymentId = String(data.id)
    const admin = createAdminClient()

    // Retry logic: 1s, 3s, 9s
    let mpPaymentData: any = null
    const delays = [0, 1000, 3000, 9000]
    for (const delay of delays) {
      if (delay > 0) await sleep(delay)
      try {
        mpPaymentData = await fetchMPPayment(mpPaymentId)
        break
      } catch (e) {
        console.error('MP payment fetch attempt failed:', e)
      }
    }

    if (!mpPaymentData) {
      console.error('Could not fetch MP payment after retries:', mpPaymentId)
      return NextResponse.json({ received: true })
    }

    const mpStatus = mpPaymentData.status as string
    const externalRef = mpPaymentData.external_reference as string

    // Find the payment in our DB by external_reference (registration_id) or preference_id
    const { data: payment } = await admin
      .from('payments')
      .select('id, registration_id, event_id, amount')
      .or(`mp_preference_id.eq.${mpPaymentData.order?.id ?? ''},registration_id.eq.${externalRef}`)
      .maybeSingle()

    if (!payment) {
      console.error('Payment not found in DB for external_reference:', externalRef)
      return NextResponse.json({ received: true })
    }

    // Map MP status to our status
    let newStatus: 'approved' | 'rejected' | 'pending' = 'pending'
    if (mpStatus === 'approved') newStatus = 'approved'
    else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(mpStatus)) newStatus = 'rejected'

    const updateData: Record<string, any> = {
      mp_payment_id: mpPaymentId,
      mp_status: mpStatus,
      mp_status_detail: mpPaymentData.status_detail,
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'approved') {
      updateData.paid_at = new Date().toISOString()
    }

    await admin.from('payments').update(updateData).eq('id', payment.id)

    // If approved: update registration and send emails
    if (newStatus === 'approved' && payment.registration_id) {
      await admin
        .from('registrations')
        .update({ status: 'purchased', updated_at: new Date().toISOString() })
        .eq('id', payment.registration_id)

      const { data: reg } = await admin
        .from('registrations')
        .select('first_name, last_name, email, events(name)')
        .eq('id', payment.registration_id)
        .single()

      if (reg) {
        const eventName = (reg.events as any)?.name ?? 'el evento'
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'
        const teamEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@onlymembers.life'

        // Team notification
        try {
          await sendEmail({
            to: teamEmail,
            subject: `Nueva compra confirmada — ${reg.first_name} ${reg.last_name}`,
            template: React.createElement('div', {},
              React.createElement('p', {}, `${reg.first_name} ${reg.last_name} (${reg.email}) pagó ${payment.amount} para ${eventName}.`),
              React.createElement('p', {}, `ID de pago MP: ${mpPaymentId}`)
            ),
          })
        } catch {}

        // User welcome email
        try {
          await sendEmail({
            to: reg.email,
            subject: `¡Tu acceso a ${eventName} está confirmado!`,
            template: React.createElement('div', {},
              React.createElement('h2', {}, `¡Bienvenido/a, ${reg.first_name}!`),
              React.createElement('p', {}, `Tu pago para ${eventName} fue confirmado.`),
              React.createElement('p', {},
                React.createElement('a', { href: `${siteUrl}/cuenta` }, 'Ver mi cuenta y QR de acceso')
              )
            ),
          })
        } catch {}
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('webhook error:', err)
    return NextResponse.json({ received: true })
  }
}

// MP also sends GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ ok: true })
}

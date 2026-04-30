import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getMPClient, Preference } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    const { registration_id, discount_code } = await req.json()
    if (!registration_id) {
      return NextResponse.json({ error: 'registration_id requerido' }, { status: 400 })
    }

    const admin = createAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

    // Fetch registration
    const { data: registration, error: regError } = await admin
      .from('registrations')
      .select('id, first_name, last_name, email, event_id, status')
      .eq('id', registration_id)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    // Fetch event with payment account
    const { data: event, error: eventError } = await admin
      .from('events')
      .select('id, name, price, currency, payments_enabled, payment_account_id')
      .eq('id', registration.event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    if (!event.payments_enabled || !event.price) {
      return NextResponse.json({ error: 'Pagos no habilitados para este evento' }, { status: 400 })
    }

    // Determine which payment account to use
    let mpAccessToken: string | null = null
    let paymentAccountId: string | null = null
    let feePercentage: number | null = null

    if (event.payment_account_id) {
      const { data: acct } = await admin
        .from('payment_accounts')
        .select('id, mp_access_token, fee_percentage, active')
        .eq('id', event.payment_account_id)
        .single()
      if (acct?.active && acct.mp_access_token) {
        mpAccessToken = acct.mp_access_token
        paymentAccountId = acct.id
        feePercentage = acct.fee_percentage
      }
    }

    if (!mpAccessToken) {
      const { data: mainAcct } = await admin
        .from('payment_accounts')
        .select('id, mp_access_token, fee_percentage, active')
        .eq('is_main_account', true)
        .eq('active', true)
        .single()
      if (mainAcct?.mp_access_token) {
        mpAccessToken = mainAcct.mp_access_token
        paymentAccountId = mainAcct.id
        feePercentage = mainAcct.fee_percentage
      }
    }

    if (!mpAccessToken) {
      // Fall back to env var
      mpAccessToken = process.env.MP_ACCESS_TOKEN ?? null
    }

    if (!mpAccessToken) {
      return NextResponse.json({ error: 'Pagos no configurados para este evento' }, { status: 400 })
    }

    // Process discount code
    let discountAmount = 0
    let usedDiscountCode: string | null = null

    if (discount_code) {
      const { data: code } = await admin
        .from('referral_codes')
        .select('id, discount_type, discount_value, max_uses, uses_count, active, event_id')
        .eq('code', discount_code.toUpperCase())
        .single()

      if (code && code.active && code.discount_type && code.discount_value) {
        const withinLimit = code.max_uses === null || (code.uses_count ?? 0) < code.max_uses
        const eventMatches = !code.event_id || code.event_id === event.id

        if (withinLimit && eventMatches) {
          if (code.discount_type === 'percentage') {
            discountAmount = (event.price * code.discount_value) / 100
          } else {
            discountAmount = Math.min(code.discount_value, event.price)
          }
          usedDiscountCode = discount_code.toUpperCase()
          // Increment uses_count
          await admin.from('referral_codes').update({ uses_count: (code.uses_count ?? 0) + 1 }).eq('id', code.id)
        }
      }
    }

    const finalAmount = Math.max(0, event.price - discountAmount)
    const feeAmount = feePercentage ? (finalAmount * feePercentage) / 100 : 0
    const netAmount = finalAmount - feeAmount

    // Create MP preference
    const mpClient = getMPClient(mpAccessToken)
    const preferenceClient = new Preference(mpClient)

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const prefResult = await preferenceClient.create({
      body: {
        items: [{
          id: registration.id,
          title: `Only Members — ${event.name}`,
          quantity: 1,
          unit_price: finalAmount,
          currency_id: event.currency || 'ARS',
        }],
        payer: {
          name: registration.first_name,
          surname: registration.last_name,
          email: registration.email,
        },
        back_urls: {
          success: `${siteUrl}/pago/exito?reg=${registration.id}`,
          failure: `${siteUrl}/pago/error?reg=${registration.id}`,
          pending: `${siteUrl}/pago/pendiente?reg=${registration.id}`,
        },
        auto_return: 'approved',
        notification_url: `${siteUrl}/api/payments/webhook`,
        external_reference: registration.id,
        expires: true,
        expiration_date_to: expiresAt,
      },
    })

    // Save payment record
    const { data: payment, error: payError } = await admin
      .from('payments')
      .insert({
        registration_id: registration.id,
        event_id: event.id,
        payment_account_id: paymentAccountId,
        mp_preference_id: prefResult.id,
        amount: finalAmount,
        currency: event.currency || 'ARS',
        discount_amount: discountAmount,
        discount_code: usedDiscountCode,
        status: 'pending',
        fee_amount: feeAmount,
        net_amount: netAmount,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (payError) {
      console.error('payment insert error:', payError.message)
    }

    return NextResponse.json({
      init_point: prefResult.init_point,
      payment_id: payment?.id ?? null,
      preference_id: prefResult.id,
    })
  } catch (err: any) {
    console.error('create-preference:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}

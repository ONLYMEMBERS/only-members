import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/resend'
import React from 'react'
import { ConfirmationEmail } from '@/emails/ConfirmationEmail'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      event_id, first_name, last_name, email, phone, country,
      city, dni, gender, instagram, language = 'es', ref_code,
    } = body

    if (!first_name || !last_name || !email || !country || !dni || !gender) {
      return NextResponse.json({ error: 'Campos requeridos faltantes.' }, { status: 400 })
    }

    // Dev mode without Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('[register:dev]', { email, event_id })
      return NextResponse.json({ success: true })
    }

    const admin = createAdminClient()

    // Internal blacklist check
    const { data: blacklisted } = await admin
      .from('blacklist')
      .select('id')
      .or(`email.eq.${email.toLowerCase().trim()},dni.eq.${dni.trim()}`)
      .maybeSingle()

    if (blacklisted) {
      return NextResponse.json({ success: false, blocked: true }, { status: 403 })
    }

    // Verify event is active/soon
    const { data: event, error: eventError } = await admin
      .from('events')
      .select('id, name, city_id, date_start, status, cities(name, country)')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 })
    }
    if (!['active', 'soon'].includes(event.status)) {
      return NextResponse.json({ error: 'El evento no acepta solicitudes.' }, { status: 400 })
    }

    // Duplicate check
    const { data: existing } = await admin
      .from('registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ya existe una solicitud con este email para este evento.' }, { status: 409 })
    }

    // Insert registration
    const { data: registration, error: insertError } = await admin
      .from('registrations')
      .insert({
        event_id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        country,
        city: city || null,
        dni: dni.trim(),
        gender,
        instagram: instagram || null,
        language,
        ref_code: ref_code || null,
        status: 'pending',
      })
      .select('id, rsvp_token')
      .single()

    if (insertError) {
      console.error('insert registration:', insertError.message)
      return NextResponse.json({ error: 'Error al guardar la solicitud.' }, { status: 500 })
    }

    // Increment referral code stats
    if (ref_code) {
      try { await admin.rpc('increment_referral', { code: ref_code }) } catch {}
    }

    // Log email and send
    try {
      await admin.from('email_logs').insert({ registration_id: registration.id, type: 'confirmation' })
    } catch {}

    const cityName = (event as any).cities?.name ?? ''
    const countryName = (event as any).cities?.country ?? ''

    await sendEmail({
      to: email,
      subject: language === 'en'
        ? `Your request for ${event.name} has been received`
        : `Tu solicitud para ${event.name} fue recibida`,
      template: React.createElement(ConfirmationEmail, {
        firstName: first_name,
        eventName: event.name,
        city: cityName,
        country: countryName,
        dateStart: event.date_start,
        language,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('register route:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

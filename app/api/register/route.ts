import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendConfirmationEmail } from '@/lib/email-sender'

export async function POST(req: NextRequest) {
  console.log('Env check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasResend: !!process.env.RESEND_API_KEY,
    hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
  })

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
      return NextResponse.json({ success: false, message: 'Ya tenés una solicitud para este evento.' })
    }

    // Insert registration
    console.log('Attempting insert:', { email, event_id })
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

    console.log('Insert result:', { data: registration?.id, error: insertError?.message })

    if (insertError) {
      console.error('insert registration:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Increment referral code stats
    if (ref_code) {
      try { await admin.rpc('increment_referral', { code: ref_code }) } catch {}
    }

    // Create Supabase Auth account (non-blocking — if user already exists, continue)
    let magicLink: string | undefined
    try {
      await admin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        email_confirm: true,
        user_metadata: { first_name: first_name.trim(), last_name: last_name.trim() },
      })
    } catch {}

    // Generate welcome magic link
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase().trim(),
        options: { redirectTo: `${siteUrl}/auth/callback` },
      })
      magicLink = (linkData as any)?.properties?.action_link ?? undefined
    } catch {}

    // Send confirmation email — non-blocking, never breaks the registration
    try {
      await sendConfirmationEmail(
        { id: registration.id, first_name, email, language, magicLink },
        event as any,
      )
    } catch (e) {
      console.error('Email confirmation failed:', e)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('register route:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

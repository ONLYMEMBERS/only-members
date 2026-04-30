import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/resend'
import React from 'react'

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, event_related } = await req.json()
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('support_messages').insert({
      name, email, message, event_related: event_related || null, status: 'unread',
    })

    if (error) {
      console.error('support insert:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send internal email notification
    try {
      const teamEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@onlymembers.life'
      await sendEmail({
        to: teamEmail,
        subject: `[Soporte] Nuevo mensaje de ${name}`,
        template: React.createElement('div', {},
          React.createElement('p', {}, `Nombre: ${name}`),
          React.createElement('p', {}, `Email: ${email}`),
          React.createElement('p', {}, `Evento: ${event_related || 'General'}`),
          React.createElement('p', {}, `Mensaje: ${message}`)
        ),
      })
    } catch {}

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('support route:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

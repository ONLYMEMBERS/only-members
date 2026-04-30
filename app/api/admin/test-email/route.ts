import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/resend'
import { ConfirmationEmail } from '@/emails/ConfirmationEmail'
import React from 'react'

async function getSession() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => (cookieStore as any).getAll() } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: 'Email destino requerido' }, { status: 400 })

  const result = await sendEmail({
    to,
    subject: '[TEST] Only Members — Email de prueba',
    template: React.createElement(ConfirmationEmail, {
      firstName: 'Admin',
      eventName: 'Only Members · Test',
      city: 'Buenos Aires',
      country: 'Argentina',
      dateStart: new Date().toISOString(),
      language: 'es',
    }),
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({ success: true, resend_id: result.id })
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { event_id, first_name, email } = await req.json()

    if (!first_name || !email) {
      return NextResponse.json({ error: 'Campos requeridos faltantes.' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('[pre-register:dev]', { email, event_id })
      return NextResponse.json({ success: true })
    }

    const admin = createAdminClient()

    // Deduplicate
    const { data: existing } = await admin
      .from('pre_registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) return NextResponse.json({ success: true })

    const { error } = await admin.from('pre_registrations').insert({
      event_id,
      first_name: first_name.trim(),
      email: email.toLowerCase().trim(),
    })

    if (error) {
      console.error('pre-register insert:', error.message)
      return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('pre-register route:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}

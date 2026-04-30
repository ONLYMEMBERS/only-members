import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { rsvp_token, response } = await req.json()

    if (!rsvp_token || !['confirmed', 'declined'].includes(response ?? '')) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('registrations')
      .update({ status: response, updated_at: new Date().toISOString() })
      .eq('rsvp_token', rsvp_token)
      .eq('status', 'invited')
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Registro no encontrado o ya respondido' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('cuenta/rsvp:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

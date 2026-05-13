import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  let query = admin.from('member_list').select('*').order('created_at', { ascending: false })
  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const body = await req.json()
  const { event_id, members } = body

  if (!event_id || !members?.length) {
    return NextResponse.json({ error: 'event_id y members requeridos' }, { status: 400 })
  }

  const rows = members.map((m: { email: string; name?: string }) => ({
    event_id,
    email: m.email.toLowerCase().trim(),
    name: m.name?.trim() || null,
    status: 'added',
  }))

  const { data, error } = await admin
    .from('member_list')
    .upsert(rows, { onConflict: 'event_id,email', ignoreDuplicates: false })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, added: data?.length ?? 0 })
}

export async function DELETE(req: NextRequest) {
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await admin.from('member_list').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

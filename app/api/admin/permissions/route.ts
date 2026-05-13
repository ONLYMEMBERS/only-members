import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_permissions')
    .select('*, events(name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const admin = createAdminClient()
  const body = await req.json()
  const { email, name, role, allowed_sections, assigned_event_id } = body

  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  const { data, error } = await admin
    .from('admin_permissions')
    .upsert({
      email,
      name: name || null,
      role: role || 'vendor',
      allowed_sections: allowed_sections || [],
      assigned_event_id: assigned_event_id || null,
      active: true,
    }, { onConflict: 'email' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const admin = createAdminClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data, error } = await admin
    .from('admin_permissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await admin
    .from('admin_permissions')
    .update({ active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

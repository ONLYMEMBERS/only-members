import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '0')
    const all = searchParams.get('all') === 'true'
    const filterEvent = searchParams.get('event') ?? ''
    const filterStatus = searchParams.get('status') ?? ''
    const search = searchParams.get('search') ?? ''

    let q = admin
      .from('registrations')
      .select('*, events(name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (!all) {
      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    }

    if (filterEvent) q = q.eq('event_id', filterEvent)
    if (filterStatus) q = q.in('status', filterStatus.split(','))
    if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, count, error } = await q
    if (error) {
      console.error('admin/registrations GET:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 })
  } catch (err: any) {
    console.error('admin/registrations GET:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno.' }, { status: 500 })
  }
}

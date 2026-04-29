import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { payload, speakers, partners } = await req.json()
    if (!payload?.name || !payload?.slug) {
      return NextResponse.json({ error: 'Nombre y slug son requeridos.' }, { status: 400 })
    }
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('events')
      .insert(payload)
      .select('id')
      .single()
    if (error) throw error

    const id = data.id

    if (speakers?.length) {
      await admin.from('speakers').delete().eq('event_id', id)
      await admin.from('speakers').insert(
        speakers.map((s: any, i: number) => ({ ...s, event_id: id, id: undefined, order_index: i }))
      )
    }
    if (partners?.length) {
      await admin.from('partners').delete().eq('event_id', id)
      await admin.from('partners').insert(
        partners.map((p: any, i: number) => ({ ...p, event_id: id, id: undefined, order_index: i }))
      )
    }

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error('admin/events POST:', err)
    return NextResponse.json({ error: err?.message ?? 'Error al crear evento.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, payload, speakers, partners } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requerido.' }, { status: 400 })

    const admin = createAdminClient()

    const { error } = await admin.from('events').update(payload).eq('id', id)
    if (error) throw error

    if (speakers?.length) {
      await admin.from('speakers').delete().eq('event_id', id)
      await admin.from('speakers').insert(
        speakers.map((s: any, i: number) => ({ ...s, event_id: id, id: undefined, order_index: i }))
      )
    }
    if (partners?.length) {
      await admin.from('partners').delete().eq('event_id', id)
      await admin.from('partners').insert(
        partners.map((p: any, i: number) => ({ ...p, event_id: id, id: undefined, order_index: i }))
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('admin/events PATCH:', err)
    return NextResponse.json({ error: err?.message ?? 'Error al actualizar evento.' }, { status: 500 })
  }
}

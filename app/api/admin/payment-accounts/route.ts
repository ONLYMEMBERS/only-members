import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('payment_accounts')
      .select('id, name, mp_access_token, mp_public_key, city_id, fee_percentage, is_main_account, active, created_at, cities(name)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ accounts: data ?? [] })
  } catch (err) {
    console.error('payment-accounts GET:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, mp_access_token, mp_public_key, city_id, fee_percentage, is_main_account } = body

    if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const admin = createAdminClient()

    // If this account is main, unset others
    if (is_main_account) {
      await admin.from('payment_accounts').update({ is_main_account: false }).eq('is_main_account', true)
    }

    const { data, error } = await admin
      .from('payment_accounts')
      .insert({
        name,
        mp_access_token: mp_access_token || null,
        mp_public_key: mp_public_key || null,
        city_id: city_id || null,
        fee_percentage: fee_percentage ? parseFloat(fee_percentage) : null,
        is_main_account: !!is_main_account,
        active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ account: data })
  } catch (err) {
    console.error('payment-accounts POST:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const admin = createAdminClient()

    if (updates.is_main_account) {
      await admin.from('payment_accounts').update({ is_main_account: false }).eq('is_main_account', true)
    }

    const { data, error } = await admin
      .from('payment_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ account: data })
  } catch (err) {
    console.error('payment-accounts PATCH:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

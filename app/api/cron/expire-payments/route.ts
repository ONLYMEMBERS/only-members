import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()

    const { data: expiredPayments, error: fetchError } = await admin
      .from('payments')
      .select('id, registration_id')
      .eq('status', 'pending')
      .lt('expires_at', now)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    if (!expiredPayments || expiredPayments.length === 0) {
      return NextResponse.json({ expired: 0 })
    }

    const expiredIds = expiredPayments.map((p) => p.id)
    const regIds = expiredPayments.map((p) => p.registration_id).filter(Boolean)

    await admin.from('payments').update({ status: 'expired' }).in('id', expiredIds)

    // Revert registrations to 'invited' so they can try again
    if (regIds.length > 0) {
      await admin
        .from('registrations')
        .update({ status: 'invited' })
        .in('id', regIds)
        .eq('status', 'purchased')
    }

    return NextResponse.json({ expired: expiredIds.length })
  } catch (err) {
    console.error('expire-payments cron:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

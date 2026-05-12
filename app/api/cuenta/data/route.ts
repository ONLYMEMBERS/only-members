import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: regs } = await admin
      .from('registrations')
      .select(`
        id, first_name, last_name, email, phone, country, city, instagram, dni,
        status, rsvp_token, created_at,
        events (
          id, name, date_start, date_end, timezone, status,
          secret_location, location_name, location_address,
          price, currency, payments_enabled, payment_account_id, cover_image,
          cities ( name, country )
        )
      `)
      .eq('email', session.user.email!)
      .order('created_at', { ascending: false })

    const registrations = regs ?? []

    const regIds = registrations.map((r: any) => r.id)
    let payments: any[] = []
    if (regIds.length > 0) {
      const { data: pays } = await admin
        .from('payments')
        .select('*')
        .in('registration_id', regIds)
      payments = pays ?? []
    }

    const accountIds = registrations
      .map((r: any) => r.events?.payment_account_id)
      .filter(Boolean) as string[]

    const { data: mainAcct } = await admin
      .from('payment_accounts')
      .select('id, mp_access_token')
      .eq('is_main_account', true)
      .eq('active', true)
      .maybeSingle()

    const mainHasToken = !!(mainAcct?.mp_access_token || process.env.MP_ACCESS_TOKEN)

    const paymentAccountsMap: Record<string, boolean> = {}
    if (accountIds.length > 0) {
      const { data: accts } = await admin
        .from('payment_accounts')
        .select('id, mp_access_token')
        .in('id', accountIds)
      ;(accts ?? []).forEach((a: any) => {
        paymentAccountsMap[a.id] = !!(a.mp_access_token)
      })
    }

    const processedRegs = registrations.map((r: any) => {
      const ev = r.events
      let paymentAvailable = false
      if (ev?.payments_enabled && ev?.price) {
        if (ev.payment_account_id) {
          paymentAvailable = paymentAccountsMap[ev.payment_account_id] ?? false
        } else {
          paymentAvailable = mainHasToken
        }
      }
      return { ...r, paymentAvailable }
    })

    return NextResponse.json({ registrations: processedRegs, payments })
  } catch (err) {
    console.error('cuenta/data:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

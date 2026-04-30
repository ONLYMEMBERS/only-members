import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { AccountContent } from './AccountContent'

export const dynamic = 'force-dynamic'

export default async function CuentaPage() {
  const siteConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!siteConfigured) {
    redirect('/')
  }

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
    redirect('/')
  }

  let registrations: any[] = []
  let payments: any[] = []
  const paymentAccountsMap: Record<string, boolean> = {}

  try {
    const admin = createAdminClient()

    const { data: regs } = await admin
      .from('registrations')
      .select(`
        id, first_name, last_name, email, status, rsvp_token, created_at,
        events (
          id, name, date_start, date_end, timezone, status,
          secret_location, location_name, location_address,
          price, currency, payments_enabled, payment_account_id, cover_image,
          cities ( name, country )
        )
      `)
      .eq('email', session.user.email!)
      .order('created_at', { ascending: false })

    registrations = regs ?? []

    // Fetch payments
    const regIds = registrations.map((r: any) => r.id)
    if (regIds.length > 0) {
      const { data: pays } = await admin
        .from('payments')
        .select('*')
        .in('registration_id', regIds)
      payments = pays ?? []
    }

    // Check which payment accounts have mp_access_token
    const accountIds = registrations
      .map((r: any) => r.events?.payment_account_id)
      .filter(Boolean) as string[]

    // Check main account
    const { data: mainAcct } = await admin
      .from('payment_accounts')
      .select('id, mp_access_token')
      .eq('is_main_account', true)
      .eq('active', true)
      .maybeSingle()

    const mainHasToken = !!(mainAcct?.mp_access_token || process.env.MP_ACCESS_TOKEN)

    if (accountIds.length > 0) {
      const { data: accts } = await admin
        .from('payment_accounts')
        .select('id, mp_access_token')
        .in('id', accountIds)
      ;(accts ?? []).forEach((a: any) => {
        paymentAccountsMap[a.id] = !!(a.mp_access_token)
      })
    }

    // Mark registrations for payment availability
    registrations = registrations.map((r: any) => {
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
  } catch (err) {
    console.error('cuenta page fetch:', err)
  }

  return (
    <AccountContent
      registrations={registrations}
      payments={payments}
    />
  )
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getMPClient, Preference } from '@/lib/mercadopago'

async function getSession() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => (cookieStore as any).getAll() } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

  try {
    const mpClient = getMPClient()
    const preferenceClient = new Preference(mpClient)
    const result = await preferenceClient.create({
      body: {
        items: [{
          id: 'test-only-members',
          title: 'Test Only Members',
          quantity: 1,
          unit_price: 10,
          currency_id: 'ARS',
        }],
        payer: { email: session.user.email ?? 'test@onlymembers.life' },
        back_urls: {
          success: `${siteUrl}/pago/exito`,
          failure: `${siteUrl}/pago/error`,
          pending: `${siteUrl}/pago/pendiente`,
        },
        auto_return: 'approved',
        external_reference: 'test-health-check',
      },
    })
    return NextResponse.json({ init_point: result.init_point, preference_id: result.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error al crear preferencia' }, { status: 500 })
  }
}

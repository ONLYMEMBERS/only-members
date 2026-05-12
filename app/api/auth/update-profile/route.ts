import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest) {
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

    const { phone, country, city, instagram } = await req.json()

    const admin = createAdminClient()
    const { error } = await admin
      .from('registrations')
      .update({
        phone: phone ?? null,
        country: country ?? null,
        city: city ?? null,
        instagram: instagram ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', session.user.email!)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('update-profile:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

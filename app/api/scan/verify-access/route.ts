import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: () => {},
    },
  })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ authorized: false })
  }

  const admin = createAdminClient()
  const { data: scanner } = await admin
    .from('scanner_permissions')
    .select('name, event_id, active')
    .eq('email', session.user.email)
    .eq('active', true)
    .maybeSingle()

  if (!scanner) {
    return NextResponse.json({ authorized: false })
  }

  let event = null
  if (scanner.event_id) {
    const { data: ev } = await admin
      .from('events')
      .select('name, cities(name)')
      .eq('id', scanner.event_id)
      .single()
    event = ev
  }

  return NextResponse.json({
    authorized: true,
    scanner: {
      name: scanner.name,
      email: session.user.email,
      event_id: scanner.event_id,
    },
    event: event ? {
      name: event.name,
      city: (event.cities as any)?.name ?? '',
    } : null,
  })
}

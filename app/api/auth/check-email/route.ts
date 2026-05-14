import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  const full = req.nextUrl.searchParams.get('full') === 'true'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false, firstName: null })
  }

  try {
    const admin = createAdminClient()

    if (full) {
      const { data } = await admin
        .from('registrations')
        .select('first_name, last_name, phone, country, city, dni, gender, instagram')
        .eq('email', email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return NextResponse.json({
        exists: !!data,
        firstName: data?.first_name ?? null,
        data: data ?? null,
      })
    }

    const { data } = await admin
      .from('registrations')
      .select('first_name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    return NextResponse.json({
      exists: !!data,
      firstName: data?.first_name ?? null,
    })
  } catch {
    return NextResponse.json({ exists: false, firstName: null })
  }
}

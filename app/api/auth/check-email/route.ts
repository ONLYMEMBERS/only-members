import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false, firstName: null })
  }

  try {
    const admin = createAdminClient()
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

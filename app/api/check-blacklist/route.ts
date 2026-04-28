import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email, dni } = await req.json()

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ blocked: false })
    }

    const admin = createAdminClient()
    const { data } = await admin
      .from('blacklist')
      .select('id')
      .or(
        `email.eq.${email?.toLowerCase()?.trim()},dni.eq.${dni?.trim()}`
      )
      .maybeSingle()

    return NextResponse.json({ blocked: !!data })
  } catch (err) {
    console.error('check-blacklist:', err)
    return NextResponse.json({ blocked: false })
  }
}

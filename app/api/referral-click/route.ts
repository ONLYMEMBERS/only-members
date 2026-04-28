import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ ok: false })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ ok: true })
    }

    const admin = createAdminClient()

    // Try RPC first, fall back to read-modify-write
    const { error } = await admin.rpc('increment_referral_click', { p_code: code })
    if (error) {
      const { data } = await admin
        .from('referral_codes')
        .select('clicks')
        .eq('code', code)
        .maybeSingle()

      if (data !== null) {
        await admin
          .from('referral_codes')
          .update({ clicks: (data?.clicks ?? 0) + 1 })
          .eq('code', code)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('referral-click:', err)
    return NextResponse.json({ ok: false })
  }
}

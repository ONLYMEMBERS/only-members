import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email requerido.' }, { status: 400 })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ success: true })
    }

    const admin = createAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/admin`,
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('admin/invite:', err)
    return NextResponse.json({ error: err?.message ?? 'Error.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/cuenta/nueva-contrasena`,
    })

    if (error) console.error('reset-password:', error)

    // Always return success — don't reveal if email exists
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('reset-password:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

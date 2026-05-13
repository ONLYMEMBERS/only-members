import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify email exists in registrations
    const { data: reg } = await admin
      .from('registrations')
      .select('first_name, last_name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (!reg) {
      return NextResponse.json({
        error: 'No encontramos este email. Registrate a un evento primero.',
      }, { status: 404 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists in auth
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail)

    if (existingUser) {
      // Update password for existing user — immediate login possible
      const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, { password })
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, needsConfirmation: false })
    }

    // New user — create via signUp to trigger confirmation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/cuenta/email-confirmado`,
        data: { first_name: reg.first_name, last_name: reg.last_name },
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'already_exists' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, needsConfirmation: true })
  } catch (err: any) {
    console.error('signup:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

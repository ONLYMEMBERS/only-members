import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify email exists in registrations
    const { data: reg } = await admin
      .from('registrations')
      .select('first_name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (!reg) {
      return NextResponse.json({
        error: 'No encontramos este email. Registrate a un evento primero.',
      }, { status: 404 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Try to create auth user — if user exists, error message will indicate it
    const { error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { first_name: reg.first_name },
    })

    if (!createError) {
      return NextResponse.json({ success: true })
    }

    // User already exists → find by listing and update password
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail)

    if (existingUser) {
      const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, { password })
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: createError.message }, { status: 500 })
  } catch (err: any) {
    console.error('signup:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

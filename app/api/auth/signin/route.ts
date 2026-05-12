import { NextRequest, NextResponse } from 'next/server'

// Sign-in with password happens client-side via supabase.auth.signInWithPassword()
// This route is kept for API consistency but the browser client handles the auth flow directly.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
  }
  return NextResponse.json({ success: true, message: 'Use client-side signInWithPassword' })
}

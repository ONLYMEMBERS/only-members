import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ users: [] })
    }
    const admin = createAdminClient()
    const { data: { users }, error } = await admin.auth.admin.listUsers()
    if (error) throw error
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      })),
    })
  } catch (err) {
    console.error('admin/users:', err)
    return NextResponse.json({ users: [] })
  }
}

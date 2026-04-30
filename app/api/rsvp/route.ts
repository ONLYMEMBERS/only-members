import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const response = searchParams.get('response')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

  if (!token || !['confirmed', 'declined'].includes(response ?? '')) {
    return NextResponse.redirect(`${siteUrl}/rsvp/invalid`)
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.redirect(`${siteUrl}/rsvp/${response}`)
    }

    const admin = createAdminClient()
    const { data: updated, error } = await admin
      .from('registrations')
      .update({
        status: response as 'confirmed' | 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('rsvp_token', token)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('rsvp update:', error.message)
      return NextResponse.redirect(`${siteUrl}/rsvp/invalid`)
    }
    if (!updated) {
      return NextResponse.redirect(`${siteUrl}/rsvp/invalid`)
    }

    return NextResponse.redirect(`${siteUrl}/rsvp/${response}`)
  } catch (err) {
    console.error('rsvp route:', err)
    return NextResponse.redirect(`${siteUrl}/rsvp/invalid`)
  }
}

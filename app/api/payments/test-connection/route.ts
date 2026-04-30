import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ connected: false, error: 'MP_ACCESS_TOKEN no configurado' })
    }
    // Use the users/me endpoint to verify credentials
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      return NextResponse.json({ connected: false, error: `MP respondió ${res.status}` })
    }

    const user = await res.json()
    return NextResponse.json({
      connected: true,
      account_email: user.email ?? null,
      account_id: user.id ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err?.message ?? 'Error' })
  }
}

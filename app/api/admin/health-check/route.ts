import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSession() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => (cookieStore as any).getAll() } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks: Record<string, any> = {}
  let overallStatus: 'healthy' | 'degraded' | 'error' = 'healthy'

  // 1. Supabase connection
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('cities').select('count', { count: 'exact', head: true })
    if (error) throw error
    checks.supabase = { status: 'ok' }
  } catch (err: any) {
    checks.supabase = { status: 'error', message: err?.message }
    overallStatus = 'error'
  }

  // 2. Supabase Storage
  try {
    const admin = createAdminClient()
    const { error } = await admin.storage.from('event-images').list('', { limit: 1 })
    if (error) throw error
    checks.storage = { status: 'ok' }
  } catch (err: any) {
    checks.storage = { status: 'error', message: err?.message }
    if (overallStatus === 'healthy') overallStatus = 'degraded'
  }

  // 3. Resend connection
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY not set')
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.message ?? 'Resend API error')
    const domains = (json?.data ?? []).map((d: any) => ({ name: d.name, status: d.status }))
    const verified = domains.filter((d: any) => d.status === 'verified').map((d: any) => d.name)
    checks.resend = {
      status: 'ok',
      from_email: process.env.RESEND_FROM_EMAIL ?? null,
      domains_verified: verified,
    }
  } catch (err: any) {
    checks.resend = { status: 'error', message: err?.message }
    overallStatus = 'error'
  }

  // 4. MercadoPago connection
  try {
    const token = process.env.MP_ACCESS_TOKEN
    if (!token) throw new Error('MP_ACCESS_TOKEN not set')
    const res = await fetch('https://api.mercadopago.com/v1/account', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.message ?? 'MP API error')
    checks.mercadopago = {
      status: 'ok',
      account_email: json?.email ?? null,
      account_id: json?.id ?? null,
    }
  } catch (err: any) {
    checks.mercadopago = { status: 'error', message: err?.message }
    overallStatus = 'error'
  }

  // 5. Main payment account
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('payment_accounts')
      .select('name')
      .eq('is_main_account', true)
      .eq('active', true)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No main payment account found')
    checks.main_account = { status: 'ok', name: data.name }
  } catch (err: any) {
    checks.main_account = { status: 'error', message: err?.message }
    if (overallStatus === 'healthy') overallStatus = 'degraded'
  }

  // 6. Environment variables
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'NEXT_PUBLIC_SITE_URL',
    'MP_ACCESS_TOKEN',
    'MP_PUBLIC_KEY',
  ]
  const envStatus: Record<string, boolean> = {}
  let allEnvOk = true
  for (const key of envVars) {
    const exists = !!process.env[key]
    envStatus[key] = exists
    if (!exists) allEnvOk = false
  }
  checks.env = {
    status: allEnvOk ? 'ok' : 'error',
    variables: envStatus,
    site_url_value: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    site_url_correct: process.env.NEXT_PUBLIC_SITE_URL === 'https://onlymembers.life',
  }
  if (!allEnvOk && overallStatus === 'healthy') overallStatus = 'degraded'

  // 7. Webhook reachability
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'
    const res = await fetch(`${siteUrl}/api/payments/webhook`, { method: 'GET' })
    const reachable = res.status < 500
    checks.webhook_reachable = { status: reachable ? 'ok' : 'error', http_status: res.status }
  } catch (err: any) {
    checks.webhook_reachable = { status: 'error', message: err?.message }
    if (overallStatus === 'healthy') overallStatus = 'degraded'
  }

  return NextResponse.json({
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
  })
}

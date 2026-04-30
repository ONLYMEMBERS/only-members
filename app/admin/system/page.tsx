'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CheckStatus = 'ok' | 'error' | 'degraded'

interface HealthData {
  status: 'healthy' | 'degraded' | 'error'
  timestamp: string
  checks: {
    supabase?: { status: CheckStatus; message?: string }
    storage?: { status: CheckStatus; message?: string }
    resend?: { status: CheckStatus; message?: string; from_email?: string; domains_verified?: string[] }
    mercadopago?: { status: CheckStatus; message?: string; account_email?: string; account_id?: string }
    main_account?: { status: CheckStatus; message?: string; name?: string }
    env?: { status: CheckStatus; variables: Record<string, boolean>; site_url_value?: string; site_url_correct?: boolean }
    webhook_reachable?: { status: CheckStatus; message?: string; http_status?: number }
  }
}

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

function StatusBadge({ status }: { status: CheckStatus | undefined }) {
  const ok = status === 'ok'
  const color = ok ? '72,187,120' : '229,62,62'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      fontSize: '11px', letterSpacing: '0.06em',
      color: `rgba(${color},0.9)`,
    }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: `rgba(${color},0.8)`,
        boxShadow: `0 0 6px rgba(${color},0.5)`,
        display: 'inline-block',
      }} />
      {ok ? 'OK' : 'ERROR'}
    </span>
  )
}

function Card({ title, status, detail }: { title: string; status: CheckStatus | undefined; detail?: React.ReactNode }) {
  const loading = status === undefined
  return (
    <div style={{
      background: '#0F0F1A',
      border: `0.5px solid rgba(${status === 'ok' ? '72,187,120' : status === 'error' ? '229,62,62' : '201,168,76'},0.15)`,
      borderRadius: '8px',
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: detail ? '12px' : 0 }}>
        <span style={{ ...S, fontSize: '12px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.6)', textTransform: 'uppercase' }}>{title}</span>
        {loading
          ? <span style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)' }}>verificando…</span>
          : <StatusBadge status={status} />
        }
      </div>
      {detail && <div style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.45)', lineHeight: 1.7 }}>{detail}</div>}
    </div>
  )
}

export default function SystemPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function runCheck() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/health-check')
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e: any) {
      setError(e.message ?? 'Error al verificar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runCheck() }, [])

  const c = data?.checks ?? {}
  const overallColor = data?.status === 'healthy' ? '72,187,120' : data?.status === 'degraded' ? '201,168,76' : '229,62,62'

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 5vw, 48px)', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '4px' }}>
            Estado del Sistema
          </h1>
          {data && (
            <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)' }}>
              Última verificación: {new Date(data.timestamp).toLocaleString('es-AR')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/admin/system/test-flow"
            style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 16px', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: 'rgba(201,168,76,0.6)', textDecoration: 'none' }}>
            SMOKE TEST
          </Link>
          <button onClick={runCheck} disabled={loading}
            style={{ ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'VERIFICANDO…' : 'REVALIDAR'}
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      {data && (
        <div style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', padding: '10px 16px', borderRadius: '4px', marginBottom: '28px', background: `rgba(${overallColor},0.06)`, border: `0.5px solid rgba(${overallColor},0.25)`, color: `rgba(${overallColor},0.9)`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: `rgba(${overallColor},0.8)`, display: 'inline-block' }} />
          {data.status === 'healthy' ? 'SISTEMA OPERATIVO' : data.status === 'degraded' ? 'SISTEMA DEGRADADO' : 'SISTEMA CON ERRORES'}
        </div>
      )}

      {error && (
        <div style={{ ...S, fontSize: '12px', padding: '12px 16px', borderRadius: '4px', marginBottom: '24px', background: 'rgba(229,62,62,0.08)', border: '0.5px solid rgba(229,62,62,0.25)', color: 'rgba(229,62,62,0.9)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Card title="Supabase Database" status={loading ? undefined : c.supabase?.status}
          detail={c.supabase?.message ? <span style={{ color: 'rgba(229,62,62,0.8)' }}>{c.supabase.message}</span> : null} />

        <Card title="Supabase Storage" status={loading ? undefined : c.storage?.status}
          detail={c.storage?.message ? <span style={{ color: 'rgba(229,62,62,0.8)' }}>{c.storage.message}</span> : null} />

        <Card title="Resend API" status={loading ? undefined : c.resend?.status}
          detail={c.resend && (
            <div>
              {c.resend.from_email && <div>From: <code style={{ color: '#C9A84C' }}>{c.resend.from_email}</code></div>}
              {c.resend.domains_verified && c.resend.domains_verified.length > 0
                ? <div>Dominios verificados: {c.resend.domains_verified.join(', ')}</div>
                : c.resend.status === 'ok' && <div style={{ color: 'rgba(201,168,76,0.7)' }}>Sin dominios verificados</div>}
              {c.resend.message && <div style={{ color: 'rgba(229,62,62,0.8)' }}>{c.resend.message}</div>}
            </div>
          )} />

        <Card title="MercadoPago" status={loading ? undefined : c.mercadopago?.status}
          detail={c.mercadopago && (
            <div>
              {c.mercadopago.account_email && <div>Cuenta: <code style={{ color: '#C9A84C' }}>{c.mercadopago.account_email}</code></div>}
              {c.mercadopago.account_id && <div>ID: {c.mercadopago.account_id}</div>}
              {c.mercadopago.message && <div style={{ color: 'rgba(229,62,62,0.8)' }}>{c.mercadopago.message}</div>}
            </div>
          )} />

        <Card title="Cuenta Principal de Pago" status={loading ? undefined : c.main_account?.status}
          detail={c.main_account && (
            <div>
              {c.main_account.name && <div>Cuenta: <code style={{ color: '#C9A84C' }}>{c.main_account.name}</code></div>}
              {c.main_account.message && <div style={{ color: 'rgba(229,62,62,0.8)' }}>{c.main_account.message}</div>}
            </div>
          )} />

        {/* Env vars */}
        <div style={{
          background: '#0F0F1A',
          border: `0.5px solid rgba(${c.env?.status === 'ok' ? '72,187,120' : '229,62,62'},0.15)`,
          borderRadius: '8px',
          padding: '20px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ ...S, fontSize: '12px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.6)', textTransform: 'uppercase' }}>Variables de Entorno</span>
            {loading ? null : <StatusBadge status={c.env?.status} />}
          </div>
          {c.env?.variables && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(c.env.variables).map(([key, exists]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <code style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.5)' }}>{key}</code>
                  <span style={{ fontSize: '11px', color: exists ? 'rgba(72,187,120,0.8)' : 'rgba(229,62,62,0.8)' }}>
                    {exists ? '✓' : '✗ FALTA'}
                  </span>
                </div>
              ))}
              {c.env.site_url_value && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid rgba(201,168,76,0.08)', ...S, fontSize: '11px' }}>
                  <span style={{ color: 'rgba(245,240,232,0.4)' }}>NEXT_PUBLIC_SITE_URL = </span>
                  <code style={{ color: c.env.site_url_correct ? 'rgba(72,187,120,0.8)' : 'rgba(229,62,62,0.8)' }}>
                    {c.env.site_url_value}
                  </code>
                  {!c.env.site_url_correct && <span style={{ color: 'rgba(229,62,62,0.7)', marginLeft: '8px' }}>(debe ser https://onlymembers.life)</span>}
                </div>
              )}
            </div>
          )}
        </div>

        <Card title="Webhook MP Alcanzable" status={loading ? undefined : c.webhook_reachable?.status}
          detail={c.webhook_reachable && (
            <div>
              {c.webhook_reachable.http_status && <div>HTTP Status: {c.webhook_reachable.http_status}</div>}
              {c.webhook_reachable.message && <div style={{ color: 'rgba(229,62,62,0.8)' }}>{c.webhook_reachable.message}</div>}
            </div>
          )} />
      </div>
    </div>
  )
}

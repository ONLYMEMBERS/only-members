'use client'

import { useState } from 'react'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const
const inputSt: React.CSSProperties = {
  ...S, fontSize: '13px', padding: '9px 12px',
  background: '#0A0A0F', border: '0.5px solid rgba(201,168,76,0.2)',
  borderRadius: '4px', color: '#F5F0E8', outline: 'none', width: '100%',
  boxSizing: 'border-box',
}

function Feedback({ ok, msg }: { ok: boolean; msg: string }) {
  const color = ok ? '72,187,120' : '229,62,62'
  return (
    <div style={{ ...S, fontSize: '12px', padding: '10px 14px', borderRadius: '4px', marginTop: '12px', background: `rgba(${color},0.08)`, border: `0.5px solid rgba(${color},0.25)`, color: `rgba(${color},0.9)` }}>
      {msg}
    </div>
  )
}

function TestCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px' }}>
      <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '4px' }}>{title}</p>
      <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.35)', marginBottom: '16px' }}>{desc}</p>
      {children}
    </div>
  )
}

export default function TestFlowPage() {
  const [emailTarget, setEmailTarget] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const [mpLoading, setMpLoading] = useState(false)
  const [mpResult, setMpResult] = useState<{ ok: boolean; msg: string; link?: string } | null>(null)

  const [magicEmail, setMagicEmail] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicResult, setMagicResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function sendTestEmail() {
    if (!emailTarget) return
    setEmailLoading(true)
    setEmailResult(null)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTarget }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setEmailResult({ ok: true, msg: `Email enviado a ${emailTarget}. Revisá tu bandeja.` })
    } catch (e: any) {
      setEmailResult({ ok: false, msg: e.message ?? 'Error al enviar' })
    } finally {
      setEmailLoading(false)
    }
  }

  async function generateMpPreference() {
    setMpLoading(true)
    setMpResult(null)
    try {
      const res = await fetch('/api/admin/test-mp-preference', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setMpResult({ ok: true, msg: 'Preferencia generada correctamente.', link: json.init_point })
    } catch (e: any) {
      setMpResult({ ok: false, msg: e.message ?? 'Error al generar preferencia' })
    } finally {
      setMpLoading(false)
    }
  }

  async function sendMagicLink() {
    if (!magicEmail) return
    setMagicLoading(true)
    setMagicResult(null)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      setMagicResult({ ok: true, msg: `Magic link enviado a ${magicEmail}. Revisá tu bandeja.` })
    } catch (e: any) {
      setMagicResult({ ok: false, msg: e.message ?? 'Error al enviar magic link' })
    } finally {
      setMagicLoading(false)
    }
  }

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 5vw, 48px)', maxWidth: '700px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '8px' }}>
        Smoke Test del Flujo
      </h1>
      <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.35)', marginBottom: '32px' }}>
        Verificaciones de extremo a extremo sin afectar datos reales.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Test email */}
        <TestCard
          title="1 · Email de Prueba"
          desc="Envía un email de testing via Resend con el template de confirmación."
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              value={emailTarget}
              onChange={(e) => setEmailTarget(e.target.value)}
              type="email"
              placeholder="destinatario@ejemplo.com"
              style={{ ...inputSt, flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter') sendTestEmail() }}
            />
            <button onClick={sendTestEmail} disabled={emailLoading || !emailTarget}
              style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', opacity: emailLoading || !emailTarget ? 0.5 : 1, whiteSpace: 'nowrap' }}>
              {emailLoading ? 'ENVIANDO…' : 'ENVIAR EMAIL'}
            </button>
          </div>
          {emailResult && <Feedback ok={emailResult.ok} msg={emailResult.msg} />}
        </TestCard>

        {/* Test MP preference */}
        <TestCard
          title="2 · Preferencia de Pago de Prueba"
          desc="Crea una preferencia MP de 10 ARS para verificar que el checkout funciona. No inserta nada en payments."
        >
          <button onClick={generateMpPreference} disabled={mpLoading}
            style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', opacity: mpLoading ? 0.5 : 1 }}>
            {mpLoading ? 'GENERANDO…' : 'GENERAR PREFERENCIA DE PRUEBA'}
          </button>
          {mpResult && (
            <div>
              <Feedback ok={mpResult.ok} msg={mpResult.msg} />
              {mpResult.link && (
                <div style={{ marginTop: '10px' }}>
                  <a href={mpResult.link} target="_blank" rel="noopener noreferrer"
                    style={{ ...S, fontSize: '12px', color: '#C9A84C', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    {mpResult.link}
                  </a>
                  <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.35)', marginTop: '4px' }}>
                    Abrí el link y verificá que el checkout de MercadoPago carga correctamente.
                  </p>
                </div>
              )}
            </div>
          )}
        </TestCard>

        {/* Magic link */}
        <TestCard
          title="3 · Verificar Magic Link"
          desc="Envía un magic link de prueba para verificar que la autenticación funciona."
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              type="email"
              placeholder="tu@email.com"
              style={{ ...inputSt, flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMagicLink() }}
            />
            <button onClick={sendMagicLink} disabled={magicLoading || !magicEmail}
              style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', opacity: magicLoading || !magicEmail ? 0.5 : 1, whiteSpace: 'nowrap' }}>
              {magicLoading ? 'ENVIANDO…' : 'ENVIAR MAGIC LINK'}
            </button>
          </div>
          {magicResult && <Feedback ok={magicResult.ok} msg={magicResult.msg} />}
        </TestCard>

      </div>
    </div>
  )
}

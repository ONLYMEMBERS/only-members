'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Registration } from '@/lib/admin-types'
import { QRCodeSVG } from 'qrcode.react'

export default function ConfirmedPage() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrReg, setQrReg] = useState<Registration | null>(null)
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('id, name, date_start, cities(name)').order('date_start', { ascending: false }).then(({ data }) => setEvents(data ?? []))
  }, [])

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    fetch(`/api/admin/registrations?event=${eventId}&status=confirmed,invited,declined,purchased,vip&all=true`)
      .then((r) => r.json())
      .then(({ data }) => {
        setRegs((data ?? []) as Registration[])
        setLoading(false)
      })
  }, [eventId])

  const confirmed = regs.filter((r) => ['confirmed', 'purchased', 'vip'].includes(r.status))
  const invited = regs.length
  const declined = regs.filter((r) => r.status === 'declined').length
  const noResponse = regs.filter((r) => r.status === 'invited').length

  const currentEvent = events.find((e) => e.id === eventId)

  async function resendToNoResponse() {
    const noResponseRegs = regs.filter((r) => r.status === 'invited')
    if (!noResponseRegs.length) return
    if (!confirm(`¿Reenviar invitación a ${noResponseRegs.length} personas sin respuesta?`)) return
    setResending(true)
    setResendResult('')
    const res = await fetch('/api/send-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_ids: noResponseRegs.map((r) => r.id),
        event_id: eventId,
        type: 'rsvp_reminder',
      }),
    })
    const data = await res.json()
    setResendResult(`Reenviado: ${data.sent ?? 0} · Errores: ${data.errors ?? 0}`)
    setResending(false)
  }

  function copyList() {
    const lines = [
      `ONLY MEMBERS — ${currentEvent?.name ?? ''}`,
      `${currentEvent?.cities?.name ?? ''}, ${currentEvent?.date_start ? new Date(currentEvent.date_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}`,
      '————————————————',
      '',
      ...confirmed.map((r) => `${r.first_name} ${r.last_name} — ${r.country ?? ''} — Confirmado ✓`),
      '',
      `Total: ${confirmed.length} confirmados`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8' }}>Confirmados</h1>
        {eventId && (
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {noResponse > 0 && (
                <button onClick={resendToNoResponse} disabled={resending}
                  style={{ ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '8px 16px', background: 'rgba(99,179,237,0.06)', border: '0.5px solid rgba(99,179,237,0.25)', borderRadius: '4px', color: 'rgba(99,179,237,0.8)', cursor: resending ? 'default' : 'pointer', textTransform: 'uppercase', opacity: resending ? 0.5 : 1 }}>
                  {resending ? 'ENVIANDO...' : `REENVIAR A ${noResponse} SIN RESPUESTA`}
                </button>
              )}
              <button onClick={copyList}
                style={{ ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '8px 16px', background: copied ? 'rgba(72,187,120,0.1)' : 'rgba(201,168,76,0.06)', border: `0.5px solid rgba(${copied ? '72,187,120' : '201,168,76'},0.3)`, borderRadius: '4px', color: copied ? 'rgba(72,187,120,0.9)' : '#C9A84C', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 200ms' }}>
                {copied ? 'COPIADO ✓' : 'COPIAR LISTA'}
              </button>
            </div>
            {resendResult && <p style={{ ...S, fontSize: '11px', color: 'rgba(72,187,120,0.8)' }}>{resendResult}</p>}
          </div>
        )}
      </div>

      {/* Event selector */}
      <div style={{ marginBottom: '24px' }}>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)}
          style={{ ...S, fontSize: '13px', padding: '10px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: eventId ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none', minWidth: '280px' }}>
          <option value="">Seleccionar evento</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {eventId && (
        <>
          {/* Metrics */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[['Invitados', invited, '#C9A84C'], ['Confirmados', confirmed.length, 'rgba(72,187,120,0.9)'], ['Declinaron', declined, 'rgba(252,129,74,0.9)'], ['Sin respuesta', noResponse, 'rgba(245,240,232,0.3)']].map(([l, v, c]) => (
              <div key={l} style={{ flex: 1, minWidth: '100px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.1)', borderRadius: '6px', padding: '16px 20px' }}>
                <p style={{ ...S, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>{l}</p>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', color: c as string }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
          ) : (
            <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                    {['Nombre', 'Email', 'País', 'Estado', 'Fecha conf.', 'QR'].map((h) => (
                      <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map((r) => (
                    <tr key={r.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{r.first_name} {r.last_name}</td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{r.email}</td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{r.country ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ ...S, fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: 'rgba(72,187,120,0.1)', border: '0.5px solid rgba(72,187,120,0.3)', color: 'rgba(72,187,120,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.35)' }}>
                        {r.updated_at ? new Date(r.updated_at).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setQrReg(r)}
                          style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', padding: '3px 8px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '2px', color: '#C9A84C', cursor: 'pointer' }}>
                          VER QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* QR Modal */}
      {qrReg && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setQrReg(null)}>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '12px', padding: '32px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ ...S, fontSize: '14px', color: '#F5F0E8', marginBottom: '8px' }}>{qrReg.first_name} {qrReg.last_name}</p>
            <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.5)', marginBottom: '24px' }}>{qrReg.email}</p>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', display: 'inline-block' }}>
              <QRCodeSVG value={qrReg.id} size={200} level="H" />
            </div>
            <p style={{ ...S, fontSize: '10px', color: 'rgba(245,240,232,0.3)', marginTop: '16px' }}>ID: {qrReg.id}</p>
            <button onClick={() => setQrReg(null)} style={{ ...S, fontSize: '10px', marginTop: '16px', padding: '8px 20px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}

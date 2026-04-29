'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Registration, STATUS_STYLES, statusLabel } from '@/lib/admin-types'
import { RegistrationDrawer } from '@/components/admin/RegistrationDrawer'
import { QRCodeSVG } from 'qrcode.react'

export default function ConfirmedPage() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState('')
  const [qrReg, setQrReg] = useState<Registration | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('id, name, date_start, cities(name)').order('date_start', { ascending: false }).then(({ data }) => setEvents(data ?? []))
  }, [])

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    fetch(`/api/admin/registrations?event=${eventId}&status=confirmed,invited,declined,purchased,vip&all=true`)
      .then((r) => r.json())
      .then(({ data }) => { setRegs((data ?? []) as Registration[]); setLoading(false) })
  }, [eventId])

  const noResponseList = regs.filter((r) => r.status === 'invited')
  const confirmedList = regs.filter((r) => ['confirmed', 'purchased', 'vip'].includes(r.status))
  const declinedList = regs.filter((r) => r.status === 'declined')
  const currentEvent = events.find((e) => e.id === eventId)

  const sections = [
    { key: 'noResponse', label: 'SIN RESPUESTA', color: '#C9A84C', border: 'rgba(201,168,76,0.3)', data: noResponseList },
    { key: 'confirmed', label: 'CONFIRMADOS', color: 'rgba(72,187,120,0.9)', border: 'rgba(72,187,120,0.3)', data: confirmedList },
    { key: 'declined', label: 'DECLINARON', color: 'rgba(252,129,74,0.9)', border: 'rgba(252,129,74,0.3)', data: declinedList },
    { key: 'all', label: 'TOTAL INVITADOS', color: 'rgba(245,240,232,0.5)', border: 'rgba(245,240,232,0.15)', data: regs },
  ]

  function toggleSection(key: string) {
    setExpandedSection((prev) => (prev === key ? null : key))
  }

  function copySection(section: typeof sections[0]) {
    const ev = currentEvent
    const lines = [
      `ONLY MEMBERS — ${ev?.name ?? ''}`,
      `${ev?.cities?.name ?? ''}, ${ev?.date_start ? new Date(ev.date_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}`,
      `${section.label}`,
      '————————————————',
      '',
      ...section.data.map((r, i) => `${i + 1}. ${r.first_name} ${r.last_name} — ${r.country ?? ''}`),
      '',
      `Total: ${section.data.length}`,
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedSection(section.key)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  async function resendToNoResponse() {
    if (!noResponseList.length) return
    if (!confirm(`¿Reenviar invitación a ${noResponseList.length} personas sin respuesta?`)) return
    setResending(true)
    setResendResult('')
    const res = await fetch('/api/send-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_ids: noResponseList.map((r) => r.id),
        event_id: eventId,
        type: 'rsvp_reminder',
      }),
    })
    const data = await res.json()
    setResendResult(`Reenviado: ${data.sent ?? 0} · Errores: ${data.errors ?? 0}`)
    setResending(false)
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '28px' }}>
        Confirmados
      </h1>

      {/* Event selector */}
      <div style={{ marginBottom: '32px' }}>
        <select value={eventId} onChange={(e) => { setEventId(e.target.value); setExpandedSection(null) }}
          style={{ ...S, fontSize: '13px', padding: '10px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: eventId ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none', minWidth: '280px' }}>
          <option value="">Seleccionar evento</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {eventId && loading && (
        <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
      )}

      {eventId && !loading && (
        <>
          {/* 4 clickeable metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {sections.map((sec) => {
              const isExpanded = expandedSection === sec.key
              return (
                <button
                  key={sec.key}
                  onClick={() => toggleSection(sec.key)}
                  style={{
                    background: isExpanded ? 'rgba(201,168,76,0.06)' : '#0F0F1A',
                    border: isExpanded ? `0.5px solid ${sec.border}` : '0.5px solid rgba(201,168,76,0.1)',
                    borderRadius: '8px', padding: '20px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 200ms ease',
                  }}
                >
                  <p style={{ ...S, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {sec.label} {isExpanded ? '▲' : '▼'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '36px', color: sec.color, lineHeight: 1 }}>
                    {sec.data.length}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Expanded section content */}
          {sections.map((sec) => (
            expandedSection === sec.key && (
              <div key={sec.key} style={{ marginBottom: '32px', animation: 'none' }}>
                {/* Section header with actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <p style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', color: sec.color, textTransform: 'uppercase' }}>
                    {sec.label} · {sec.data.length} personas
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {sec.key === 'noResponse' && noResponseList.length > 0 && (
                      <button onClick={resendToNoResponse} disabled={resending}
                        style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '7px 14px', background: 'rgba(99,179,237,0.06)', border: '0.5px solid rgba(99,179,237,0.25)', borderRadius: '4px', color: 'rgba(99,179,237,0.8)', cursor: resending ? 'default' : 'pointer', textTransform: 'uppercase', opacity: resending ? 0.5 : 1 }}>
                        {resending ? 'ENVIANDO...' : 'REENVIAR INVITACIÓN'}
                      </button>
                    )}
                    <button onClick={() => copySection(sec)}
                      style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '7px 14px', background: copiedSection === sec.key ? 'rgba(72,187,120,0.08)' : 'rgba(201,168,76,0.06)', border: `0.5px solid rgba(${copiedSection === sec.key ? '72,187,120' : '201,168,76'},0.25)`, borderRadius: '4px', color: copiedSection === sec.key ? 'rgba(72,187,120,0.9)' : '#C9A84C', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 200ms' }}>
                      {copiedSection === sec.key ? '✓ COPIADO' : 'COPIAR LISTA'}
                    </button>
                  </div>
                </div>
                {resendResult && sec.key === 'noResponse' && (
                  <p style={{ ...S, fontSize: '11px', color: 'rgba(72,187,120,0.8)', marginBottom: '12px' }}>{resendResult}</p>
                )}

                {/* Table */}
                <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                  {sec.data.length === 0 ? (
                    <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)', padding: '32px', textAlign: 'center' }}>Sin registros en esta categoría</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                          {['Nombre', 'Email', 'País', 'Instagram', 'Fecha reg.', 'Estado', ''].map((h) => (
                            <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.data.map((r) => {
                          const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending
                          return (
                            <tr key={r.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.02)'}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                              <td style={{ ...S, padding: '10px 16px', fontSize: '13px', color: '#F5F0E8', whiteSpace: 'nowrap' }}>{r.first_name} {r.last_name}</td>
                              <td style={{ ...S, padding: '10px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{r.email}</td>
                              <td style={{ ...S, padding: '10px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{r.country ?? '—'}</td>
                              <td style={{ ...S, padding: '10px 16px', fontSize: '12px', color: 'rgba(201,168,76,0.6)' }}>{r.instagram ?? '—'}</td>
                              <td style={{ ...S, padding: '10px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.35)', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('es-ES')}</td>
                              <td style={{ padding: '10px 16px' }}>
                                <span style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '2px', background: st.bg, border: `0.5px solid ${st.border}`, color: st.color }}>
                                  {statusLabel(r.status)}
                                </span>
                              </td>
                              <td style={{ padding: '10px 16px' }}>
                                <button onClick={() => setSelectedReg(r)}
                                  style={{ ...S, fontSize: '11px', padding: '3px 10px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '3px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>
                                  ···
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
          ))}
        </>
      )}

      {/* QR Modal (legacy, kept for compatibility) */}
      {qrReg && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setQrReg(null)}>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '12px', padding: '32px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ ...S, fontSize: '14px', color: '#F5F0E8', marginBottom: '8px' }}>{qrReg.first_name} {qrReg.last_name}</p>
            <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.5)', marginBottom: '24px' }}>{qrReg.email}</p>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', display: 'inline-block' }}>
              <QRCodeSVG value={qrReg.id} size={200} level="H" />
            </div>
            <button onClick={() => setQrReg(null)} style={{ ...S, fontSize: '10px', marginTop: '16px', padding: '8px 20px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}

      <RegistrationDrawer
        reg={selectedReg}
        onClose={() => setSelectedReg(null)}
        onUpdate={(updated) => {
          setRegs((prev) => prev.map((r) => r.id === updated.id ? updated : r))
          setSelectedReg(updated)
        }}
      />
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Registration, STATUS_STYLES, statusLabel } from '@/lib/admin-types'

const STEPS = ['Seleccionar', 'Redactar', 'Confirmar']
const VARS = ['{{nombre}}', '{{apellido}}', '{{evento}}', '{{ciudad}}', '{{fecha}}', '{{link_compra}}']

function applyVars(text: string, data: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`)
}

export default function InvitationsPage() {
  const [step, setStep] = useState(0)
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [regs, setRegs] = useState<Registration[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState('')
  const [subjectEs, setSubjectEs] = useState('Estás invitado/a a {{evento}}')
  const [subjectEn, setSubjectEn] = useState('You are invited to {{evento}}')
  const [bodyEs, setBodyEs] = useState('Hola {{nombre}},\n\nHas sido seleccionado/a para asistir a {{evento}} en {{ciudad}}.\n\nResilio')
  const [bodyEn, setBodyEn] = useState('Hello {{nombre}},\n\nYou have been selected to attend {{evento}} in {{ciudad}}.\n\nResilio')
  const [templates, setTemplates] = useState<any[]>([])
  const [templateName, setTemplateName] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; errors: number } | null>(null)
  const [loadingRegs, setLoadingRegs] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('id, name, date_start, cities(name)').order('created_at', { ascending: false }).then(({ data }) => setEvents(data ?? []))
    supabase.from('email_templates').select('*').then(({ data }) => setTemplates(data ?? []))
  }, [])

  useEffect(() => {
    if (!eventId) { setRegs([]); return }
    setLoadingRegs(true)
    let q = supabase.from('registrations').select('*, events(name)').eq('event_id', eventId)
    if (filterStatus) q = q.eq('status', filterStatus)
    q.then(({ data }) => { setRegs((data ?? []) as Registration[]); setLoadingRegs(false) })
  }, [eventId, filterStatus])

  const currentEvent = useMemo(() => events.find((e) => e.id === eventId), [events, eventId])
  const invitedCount = regs.filter((r) => r.status === 'invited').length
  const pendingCount = regs.filter((r) => r.status === 'pending').length

  async function send() {
    if (!selected.size) return
    setSending(true)
    setSendResult(null)
    const ids = Array.from(selected)
    const res = await fetch('/api/send-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_ids: ids, event_id: eventId, subject_es: subjectEs, subject_en: subjectEn, body_es: bodyEs, body_en: bodyEn }),
    })
    const data = await res.json()
    setSendResult({ sent: data.sent ?? 0, errors: data.errors ?? 0 })
    setSending(false)
    // Refresh regs
    setSelected(new Set())
    setStep(0)
    supabase.from('registrations').select('*, events(name)').eq('event_id', eventId).then(({ data: d }) => setRegs((d ?? []) as Registration[]))
  }

  async function saveTemplate() {
    if (!templateName) return
    await supabase.from('email_templates').insert({ name: templateName, type: 'invitation', subject_es: subjectEs, subject_en: subjectEn, body_es: bodyEs, body_en: bodyEn })
    setTemplateName('')
    supabase.from('email_templates').select('*').then(({ data }) => setTemplates(data ?? []))
  }

  function loadTemplate(tpl: any) {
    setSubjectEs(tpl.subject_es ?? ''); setSubjectEn(tpl.subject_en ?? '')
    setBodyEs(tpl.body_es ?? ''); setBodyEn(tpl.body_en ?? '')
  }

  const previewData = {
    nombre: 'Ana', apellido: 'García', evento: currentEvent?.name ?? 'Evento',
    ciudad: currentEvent?.cities?.name ?? 'Ciudad',
    fecha: currentEvent?.date_start ? new Date(currentEvent.date_start).toLocaleDateString('es-ES') : '—',
    link_compra: currentEvent?.purchase_link ?? '#',
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1200px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>
        Invitaciones
      </h1>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '36px', borderRadius: '6px', overflow: 'hidden', border: '0.5px solid rgba(201,168,76,0.15)' }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step + 1 && setStep(i)}
            style={{ flex: 1, padding: '14px', ...S, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', background: step === i ? 'rgba(201,168,76,0.1)' : 'transparent', color: step === i ? '#C9A84C' : step > i ? 'rgba(72,187,120,0.7)' : 'rgba(245,240,232,0.3)', border: 'none', borderRight: i < 2 ? '0.5px solid rgba(201,168,76,0.12)' : 'none', cursor: i < step + 1 ? 'pointer' : 'default' }}>
            {i + 1}. {s} {step > i ? '✓' : ''}
          </button>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <div>
          {/* Event select */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Evento</label>
            <select value={eventId} onChange={(e) => { setEventId(e.target.value); setSelected(new Set()) }}
              style={{ ...S, fontSize: '13px', padding: '10px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: eventId ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none', minWidth: '300px' }}>
              <option value="">Seleccionar evento</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {eventId && (
            <>
              {/* Metrics bar */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                {[['Total', regs.length], ['Seleccionados', selected.size], ['Ya invitados', invitedCount], ['Pendientes', pendingCount]].map(([l, v]) => (
                  <div key={l} style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '6px', padding: '14px 20px', flex: 1 }}>
                    <p style={{ ...S, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>{l}</p>
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', color: l === 'Seleccionados' && (v as number) > 0 ? '#C9A84C' : '#F5F0E8' }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ ...S, fontSize: '12px', padding: '7px 12px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: filterStatus ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none' }}>
                  <option value="">Todos los estados</option>
                  {['pending', 'invited', 'confirmed', 'declined', 'waitlist', 'vip'].map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox"
                    checked={selected.size === regs.length && regs.length > 0}
                    onChange={(e) => setSelected(e.target.checked ? new Set(regs.map((r) => r.id)) : new Set())}
                    style={{ accentColor: '#C9A84C' }} />
                  <span style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.55)' }}>Seleccionar todos</span>
                </label>
              </div>

              {/* Table */}
              <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                {loadingRegs ? (
                  <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                        {['', 'Nombre', 'Email', 'País', 'Estado'].map((h) => (
                          <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {regs.map((r) => {
                        const checked = selected.has(r.id)
                        const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending
                        return (
                          <tr key={r.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)', background: checked ? 'rgba(201,168,76,0.04)' : 'transparent' }}>
                            <td style={{ padding: '10px 16px', width: '32px' }}>
                              <input type="checkbox" checked={checked} style={{ accentColor: '#C9A84C' }}
                                onChange={(e) => setSelected((p) => { const n = new Set(p); if (e.target.checked) n.add(r.id); else n.delete(r.id); return n })} />
                            </td>
                            <td style={{ ...S, padding: '10px 16px', fontSize: '13px', color: '#F5F0E8' }}>{r.first_name} {r.last_name}</td>
                            <td style={{ ...S, padding: '10px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{r.email}</td>
                            <td style={{ ...S, padding: '10px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{r.country ?? '—'}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '2px', background: st.bg, border: `0.5px solid ${st.border}`, color: st.color }}>{statusLabel(r.status)}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <button
                disabled={!selected.size}
                onClick={() => setStep(1)}
                style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', padding: '12px 24px', background: selected.size ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.04)', border: `0.5px solid rgba(201,168,76,${selected.size ? '0.4' : '0.15'})`, borderRadius: '4px', color: selected.size ? '#C9A84C' : 'rgba(201,168,76,0.3)', cursor: selected.size ? 'pointer' : 'default', textTransform: 'uppercase' }}>
                Continuar con {selected.size} seleccionados →
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div>
          {/* Template selector */}
          {templates.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Template guardado</label>
              <select onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); if (t) loadTemplate(t) }}
                style={{ ...S, fontSize: '12px', padding: '8px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none' }}>
                <option value="">Seleccionar template</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Variables */}
              <div>
                <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '8px' }}>Variables disponibles</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {VARS.map((v) => (
                    <span key={v} style={{ ...S, fontSize: '10px', padding: '3px 8px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '3px', color: 'rgba(201,168,76,0.7)' }}>{v}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>Asunto (ES)</label>
                <input value={subjectEs} onChange={(e) => setSubjectEs(e.target.value)} style={{ background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(201,168,76,0.2)', padding: '8px 0', color: '#F5F0E8', ...S, fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>Asunto (EN)</label>
                <input value={subjectEn} onChange={(e) => setSubjectEn(e.target.value)} style={{ background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(201,168,76,0.2)', padding: '8px 0', color: '#F5F0E8', ...S, fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>Cuerpo (ES)</label>
                <textarea value={bodyEs} onChange={(e) => setBodyEs(e.target.value)} rows={8} style={{ background: 'rgba(201,168,76,0.03)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '4px', padding: '10px 12px', color: '#F5F0E8', ...S, fontSize: '13px', outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>Cuerpo (EN)</label>
                <textarea value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} rows={8} style={{ background: 'rgba(201,168,76,0.03)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '4px', padding: '10px 12px', color: '#F5F0E8', ...S, fontSize: '13px', outline: 'none', resize: 'vertical' }} />
              </div>

              {/* Save template */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nombre del template" style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(201,168,76,0.2)', padding: '6px 0', color: '#F5F0E8', ...S, fontSize: '12px', outline: 'none' }} />
                <button onClick={saveTemplate} style={{ ...S, fontSize: '10px', padding: '6px 12px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '3px', color: '#C9A84C', cursor: 'pointer' }}>Guardar</button>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '12px' }}>Preview (ES)</p>
              <div style={{ background: '#0A0A0F', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '6px', padding: '24px', fontFamily: 'Georgia, serif' }}>
                <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#F5F0E8', marginBottom: '20px', borderBottom: '0.5px solid rgba(201,168,76,0.15)', paddingBottom: '16px' }}>ONLY MEMBERS</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>{applyVars(subjectEs, previewData)}</p>
                <pre style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0' }}>
                  {applyVars(bodyEs, previewData)}
                </pre>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button onClick={() => setStep(0)} style={{ ...S, fontSize: '11px', padding: '10px 20px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>← Volver</button>
            <button onClick={() => setStep(2)} style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', padding: '10px 24px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.4)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', textTransform: 'uppercase' }}>Confirmar →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '8px', padding: '28px', marginBottom: '24px' }}>
            <p style={{ ...S, fontSize: '15px', color: '#F5F0E8', marginBottom: '16px', lineHeight: 1.5 }}>
              Vas a enviar <strong style={{ color: '#C9A84C' }}>{selected.size} emails</strong> de invitación al evento{' '}
              <strong style={{ color: '#C9A84C' }}>{currentEvent?.name}</strong>
            </p>
            <p style={{ ...S, fontSize: '12px', color: 'rgba(201,168,76,0.6)', marginBottom: '16px' }}>Asunto: {subjectEs}</p>
            {/* First 5 recipients */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {regs.filter((r) => selected.has(r.id)).slice(0, 5).map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', ...S, fontSize: '12px', color: 'rgba(245,240,232,0.6)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
                  {r.first_name} {r.last_name} — {r.email}
                </div>
              ))}
              {selected.size > 5 && <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', marginTop: '4px' }}>...y {selected.size - 5} más</p>}
            </div>
          </div>

          {sendResult && (
            <div style={{ padding: '16px 20px', background: sendResult.errors > 0 ? 'rgba(252,129,74,0.08)' : 'rgba(72,187,120,0.08)', border: `0.5px solid rgba(${sendResult.errors > 0 ? '252,129,74' : '72,187,120'},0.25)`, borderRadius: '6px', marginBottom: '20px', ...S, fontSize: '13px', color: sendResult.errors > 0 ? 'rgba(252,129,74,0.9)' : 'rgba(72,187,120,0.9)' }}>
              ✓ Enviados: {sendResult.sent} · Errores: {sendResult.errors}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(1)} disabled={sending} style={{ ...S, fontSize: '11px', padding: '12px 20px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>← Volver</button>
            <button onClick={() => { if (confirm(`¿Enviar ${selected.size} invitaciones?`)) send() }} disabled={sending}
              style={{ ...S, fontSize: '11px', letterSpacing: '0.15em', padding: '12px 28px', background: sending ? 'rgba(201,168,76,0.04)' : 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.4)', borderRadius: '4px', color: '#C9A84C', cursor: sending ? 'default' : 'pointer', textTransform: 'uppercase' }}>
              {sending ? 'ENVIANDO...' : 'ENVIAR AHORA'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

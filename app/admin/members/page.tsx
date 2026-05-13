'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'

const GOLD = '#C9A84C'
const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

type MemberRow = {
  id: string
  event_id: string
  email: string
  name: string | null
  qr_sent: boolean
  qr_sent_at: string | null
  status: string
  created_at: string
}

function parseEmails(raw: string): { valid: string[]; invalid: string[] } {
  const parts = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
  const valid: string[] = []
  const invalid: string[] = []
  parts.forEach((p) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p)) valid.push(p.toLowerCase())
    else invalid.push(p)
  })
  const uniqueValid = valid.filter((v, i, arr) => arr.indexOf(v) === i)
  return { valid: uniqueValid, invalid }
}

export default function MembersPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'single' | 'bulk' | 'excel'>('single')
  const [singleEmail, setSingleEmail] = useState('')
  const [singleName, setSingleName] = useState('')
  const [bulkRaw, setBulkRaw] = useState('')
  const [bulkParsed, setBulkParsed] = useState<{ valid: string[]; invalid: string[] } | null>(null)
  const [excelRows, setExcelRows] = useState<{ email: string; name?: string }[]>([])
  const [excelInfo, setExcelInfo] = useState<{ valid: number; duplicates: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sendingQr, setSendingQr] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputSt: React.CSSProperties = {
    ...S, fontSize: '13px', padding: '9px 12px',
    background: '#0A0A0F', border: '0.5px solid rgba(201,168,76,0.2)',
    borderRadius: '4px', color: '#F5F0E8', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  }

  useEffect(() => {
    supabase.from('events').select('id, name, cities(name)').in('status', ['active', 'soon', 'closed']).order('date_start', { ascending: false })
      .then(({ data }) => setEvents(data ?? []))
  }, [])

  useEffect(() => {
    if (!eventId) { setMembers([]); return }
    setLoading(true)
    fetch(`/api/admin/members?event_id=${eventId}`)
      .then((r) => r.json())
      .then(({ data }) => { setMembers(data ?? []); setLoading(false) })
  }, [eventId])

  async function addSingle() {
    if (!singleEmail || !eventId) return
    setSaving(true)
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, members: [{ email: singleEmail, name: singleName || undefined }] }),
    })
    const data = await res.json()
    if (data.error) {
      setFeedback(`Error: ${data.error}`)
    } else {
      setSingleEmail(''); setSingleName('')
      setFeedback(`✓ Member agregado`)
      setMembers((prev) => [...(data.data ?? []), ...prev])
    }
    setSaving(false)
    setTimeout(() => setFeedback(null), 3000)
  }

  async function addBulk() {
    if (!bulkParsed?.valid.length || !eventId) return
    setSaving(true)
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, members: bulkParsed.valid.map((e) => ({ email: e })) }),
    })
    const data = await res.json()
    if (data.error) {
      setFeedback(`Error: ${data.error}`)
    } else {
      setBulkRaw(''); setBulkParsed(null)
      setFeedback(`✓ ${data.added ?? bulkParsed.valid.length} members agregados`)
      const newMems = await fetch(`/api/admin/members?event_id=${eventId}`).then((r) => r.json())
      setMembers(newMems.data ?? [])
    }
    setSaving(false)
    setTimeout(() => setFeedback(null), 4000)
  }

  async function handleExcel(file: File) {
    const { read, utils } = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = utils.sheet_to_json(ws, { defval: '' })
    const normalized = rows
      .map((r: any) => ({
        email: (r.email || r.Email || r.EMAIL || '').toString().toLowerCase().trim(),
        name: (r.name || r.Name || r.nombre || r.Nombre || '').toString().trim() || undefined,
      }))
      .filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))

    const existingEmails = new Set(members.map((m) => m.email))
    const dupes = normalized.filter((r) => existingEmails.has(r.email)).length
    setExcelRows(normalized)
    setExcelInfo({ valid: normalized.length, duplicates: dupes })
  }

  async function importExcel() {
    if (!excelRows.length || !eventId) return
    setSaving(true)
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, members: excelRows }),
    })
    const data = await res.json()
    if (data.error) {
      setFeedback(`Error: ${data.error}`)
    } else {
      setExcelRows([]); setExcelInfo(null)
      setFeedback(`✓ ${data.added ?? excelRows.length} members importados`)
      const newMems = await fetch(`/api/admin/members?event_id=${eventId}`).then((r) => r.json())
      setMembers(newMems.data ?? [])
    }
    setSaving(false)
    setTimeout(() => setFeedback(null), 4000)
  }

  async function sendQr() {
    if (!selected.size || !eventId) return
    setSendingQr(true)
    const res = await fetch('/api/admin/members/send-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds: Array.from(selected), eventId }),
    })
    const data = await res.json()
    setFeedback(`✓ Enviados: ${data.sent} · Errores: ${data.errors}`)
    setSelected(new Set())
    const newMems = await fetch(`/api/admin/members?event_id=${eventId}`).then((r) => r.json())
    setMembers(newMems.data ?? [])
    setSendingQr(false)
    setTimeout(() => setFeedback(null), 5000)
  }

  async function deleteMember(id: string) {
    if (!confirm('¿Eliminar member?')) return
    await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' })
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const metrics = {
    total: members.length,
    sent: members.filter((m) => m.qr_sent).length,
    pending: members.filter((m) => !m.qr_sent).length,
  }

  const TABS = [
    { key: 'single', label: 'Email individual' },
    { key: 'bulk', label: 'Múltiples emails' },
    { key: 'excel', label: 'Excel / CSV' },
  ] as const

  return (
    <div style={{ padding: 'clamp(24px,4vw,40px) clamp(16px,5vw,48px)', maxWidth: '1000px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '8px' }}>
        Members
      </h1>
      <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.35)', marginBottom: '28px' }}>
        Acceso exclusivo Member por evento
      </p>

      {/* Event selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', display: 'block', marginBottom: '6px' }}>EVENTO</label>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={{ ...inputSt, maxWidth: '360px', colorScheme: 'light' }}
        >
          <option value="">Seleccionar evento</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}{(e.cities as any)?.name ? ` — ${(e.cities as any).name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {eventId && (
        <>
          {/* Metrics */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Total Members', value: metrics.total, color: 'rgba(245,240,232,0.7)' },
              { label: 'QRs enviados', value: metrics.sent, color: 'rgba(34,197,94,0.8)' },
              { label: 'Pendientes', value: metrics.pending, color: GOLD },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '16px 20px', flex: 1, textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '28px', color, margin: '0 0 4px' }}>{value}</p>
                <p style={{ ...S, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(245,240,232,0.3)', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Add methods tabs */}
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', marginBottom: '16px' }}>AGREGAR MEMBERS</p>

            <div style={{ display: 'flex', gap: '0', borderBottom: '0.5px solid rgba(201,168,76,0.12)', marginBottom: '20px' }}>
              {TABS.map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key as any)}
                  style={{ ...S, fontSize: '11px', letterSpacing: '0.08em', padding: '8px 18px', background: 'transparent', border: 'none', cursor: 'pointer', color: tab === key ? GOLD : 'rgba(245,240,232,0.35)', borderBottom: tab === key ? `1px solid ${GOLD}` : '1px solid transparent', marginBottom: '-0.5px' }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'single' && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '4px' }}>EMAIL</label>
                  <input type="email" value={singleEmail} onChange={(e) => setSingleEmail(e.target.value)} placeholder="member@email.com" style={inputSt} onKeyDown={(e) => e.key === 'Enter' && addSingle()} />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '4px' }}>NOMBRE (opcional)</label>
                  <input value={singleName} onChange={(e) => setSingleName(e.target.value)} placeholder="Nombre" style={inputSt} onKeyDown={(e) => e.key === 'Enter' && addSingle()} />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <button onClick={addSingle} disabled={saving || !singleEmail}
                    style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: GOLD, cursor: 'pointer', opacity: saving || !singleEmail ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                    AGREGAR MEMBER
                  </button>
                </div>
              </div>
            )}

            {tab === 'bulk' && (
              <div>
                <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '6px' }}>
                  Pegá emails separados por coma o uno por línea
                </label>
                <textarea
                  value={bulkRaw}
                  onChange={(e) => { setBulkRaw(e.target.value); setBulkParsed(null) }}
                  onBlur={() => { if (bulkRaw) setBulkParsed(parseEmails(bulkRaw)) }}
                  rows={6}
                  placeholder="email1@ejemplo.com&#10;email2@ejemplo.com&#10;email3@ejemplo.com"
                  style={{ ...inputSt, resize: 'vertical' }}
                />
                {bulkParsed && (
                  <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)', marginTop: '8px' }}>
                    <span style={{ color: 'rgba(34,197,94,0.8)' }}>{bulkParsed.valid.length} válidos</span>
                    {bulkParsed.invalid.length > 0 && <span style={{ color: 'rgba(239,68,68,0.7)', marginLeft: '12px' }}>{bulkParsed.invalid.length} inválidos</span>}
                  </p>
                )}
                <button onClick={addBulk} disabled={saving || !bulkParsed?.valid.length}
                  style={{ marginTop: '12px', ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: GOLD, cursor: 'pointer', opacity: saving || !bulkParsed?.valid.length ? 0.5 : 1 }}>
                  AGREGAR {bulkParsed?.valid.length ? `${bulkParsed.valid.length} ` : ''}MEMBERS
                </button>
              </div>
            )}

            {tab === 'excel' && (
              <div>
                <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExcel(f) }} />
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border: '0.5px dashed rgba(201,168,76,0.25)', borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px' }}
                >
                  <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)', marginBottom: '8px' }}>
                    Arrastrá o hacé click para cargar
                  </p>
                  <p style={{ ...S, fontSize: '11px', color: 'rgba(201,168,76,0.5)' }}>
                    .xlsx · .csv (columnas: email, nombre)
                  </p>
                </div>
                {excelInfo && (
                  <>
                    <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)', marginBottom: '12px' }}>
                      <span style={{ color: 'rgba(34,197,94,0.8)' }}>{excelInfo.valid} registros válidos</span>
                      {excelInfo.duplicates > 0 && <span style={{ color: GOLD, marginLeft: '12px' }}>{excelInfo.duplicates} duplicados</span>}
                    </p>
                    {excelRows.slice(0, 10).length > 0 && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', ...S, fontSize: '12px' }}>
                        <tbody>
                          {excelRows.slice(0, 10).map((r, i) => (
                            <tr key={i} style={{ borderBottom: '0.5px solid rgba(201,168,76,0.06)' }}>
                              <td style={{ padding: '6px 0', color: '#F5F0E8' }}>{r.email}</td>
                              <td style={{ padding: '6px 0', color: 'rgba(245,240,232,0.4)' }}>{r.name ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <button onClick={importExcel} disabled={saving}
                      style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: GOLD, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                      {saving ? 'IMPORTANDO...' : `IMPORTAR ${excelInfo.valid} MEMBERS`}
                    </button>
                  </>
                )}
              </div>
            )}

            {feedback && (
              <div style={{ marginTop: '14px', ...S, fontSize: '12px', padding: '8px 12px', borderRadius: '4px', background: feedback.startsWith('Error') ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `0.5px solid rgba(${feedback.startsWith('Error') ? '239,68,68' : '34,197,94'},0.25)`, color: feedback.startsWith('Error') ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)' }}>
                {feedback}
              </div>
            )}
          </div>

          {/* Members list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={selected.size === members.length && members.length > 0}
                  onChange={(e) => setSelected(e.target.checked ? new Set(members.map((m) => m.id)) : new Set())}
                  style={{ accentColor: GOLD }} />
                <span style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.5)' }}>Seleccionar todos</span>
              </label>
              {selected.size > 0 && (
                <span style={{ ...S, fontSize: '11px', color: GOLD }}>{selected.size} seleccionados</span>
              )}
            </div>
            {selected.size > 0 && (
              <button onClick={sendQr} disabled={sendingQr}
                style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 18px', background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.4)', borderRadius: '4px', color: GOLD, cursor: 'pointer', opacity: sendingQr ? 0.5 : 1 }}>
                {sendingQr ? 'ENVIANDO...' : `♛ ENVIAR QR A ${selected.size} MEMBERS`}
              </button>
            )}
          </div>

          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                    {['', 'Nombre', 'Email', 'Estado', 'QR Enviado', ''].map((h) => (
                      <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.3)', fontWeight: 300 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)', background: selected.has(m.id) ? 'rgba(201,168,76,0.03)' : 'transparent' }}>
                      <td style={{ padding: '10px 16px', width: '32px' }}>
                        <input type="checkbox" checked={selected.has(m.id)} style={{ accentColor: GOLD }}
                          onChange={(e) => setSelected((p) => { const n = new Set(p); if (e.target.checked) n.add(m.id); else n.delete(m.id); return n })} />
                      </td>
                      <td style={{ ...S, padding: '10px 16px', fontSize: '13px', color: '#F5F0E8' }}>
                        {m.name ?? <span style={{ color: 'rgba(245,240,232,0.3)' }}>—</span>}
                      </td>
                      <td style={{ ...S, padding: '10px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{m.email}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '2px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.2)', color: GOLD }}>
                          {m.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {m.qr_sent
                          ? <span style={{ ...S, fontSize: '11px', color: 'rgba(34,197,94,0.8)' }}>
                              ✓ {m.qr_sent_at ? new Date(m.qr_sent_at).toLocaleDateString('es-ES') : ''}
                            </span>
                          : <span style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.25)' }}>Pendiente</span>
                        }
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button onClick={() => deleteMember(m.id)}
                          style={{ ...S, fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: '3px', color: 'rgba(239,68,68,0.6)', cursor: 'pointer' }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td colSpan={6} style={{ ...S, padding: '32px', textAlign: 'center', fontSize: '13px', color: 'rgba(245,240,232,0.2)' }}>Sin members para este evento.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

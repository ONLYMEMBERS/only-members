'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ReferralCode } from '@/lib/admin-types'

function generateCode(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase()
}

type NewCodeForm = {
  name: string
  discount_type: '' | 'percentage' | 'fixed'
  discount_value: string
  max_uses: string
}

const INIT_FORM: NewCodeForm = { name: '', discount_type: '', discount_value: '', max_uses: '' }

export default function ReferralsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [newForm, setNewForm] = useState<NewCodeForm>(INIT_FORM)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReferralCode | null>(null)
  const [usageHistory, setUsageHistory] = useState<any[]>([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  const supabase = createClient()

  const currentEvent = events.find((e) => e.id === eventId)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.life'

  useEffect(() => {
    supabase.from('events').select('id, name, slug').order('created_at', { ascending: false }).then(({ data }) => setEvents(data ?? []))
  }, [])

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    supabase.from('referral_codes').select('*').eq('event_id', eventId).order('created_at', { ascending: false }).then(({ data }) => {
      setCodes((data ?? []) as ReferralCode[])
      setLoading(false)
    })
  }, [eventId])

  async function openDrawer(code: ReferralCode) {
    setSelected(code)
    setLoadingUsage(true)
    const { data } = await supabase
      .from('payments')
      .select('id, status, amount, currency, created_at, registrations(first_name, last_name, email)')
      .eq('discount_code', code.code)
      .order('created_at', { ascending: false })
    setUsageHistory(data ?? [])
    setLoadingUsage(false)
  }

  async function createCode() {
    if (!eventId || !newForm.name.trim()) return
    const code = generateCode()
    const insert: any = {
      event_id: eventId,
      code,
      name: newForm.name.trim(),
      active: true,
    }
    if (newForm.discount_type) insert.discount_type = newForm.discount_type
    if (newForm.discount_value) insert.discount_value = parseFloat(newForm.discount_value)
    if (newForm.max_uses) insert.max_uses = parseInt(newForm.max_uses)
    const { data } = await supabase.from('referral_codes').insert(insert).select().single()
    if (data) setCodes((p) => [data as ReferralCode, ...p])
    setNewForm(INIT_FORM)
  }

  async function toggleActive(code: ReferralCode) {
    const next = !code.active
    await supabase.from('referral_codes').update({ active: next }).eq('id', code.id)
    setCodes((p) => p.map((c) => c.id === code.id ? { ...c, active: next } : c))
    if (selected?.id === code.id) setSelected((p) => p ? { ...p, active: next } : p)
  }

  function copyLink(code: string) {
    const slug = currentEvent?.slug ?? ''
    const link = `${siteUrl}/events/${slug}?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  function discountLabel(c: ReferralCode) {
    if (!c.discount_type || c.discount_value == null) return '—'
    return c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const
  const inputSt: React.CSSProperties = { ...S, fontSize: '13px', padding: '10px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none' }

  return (
    <div style={{ padding: 'clamp(24px,4vw,40px) clamp(16px,5vw,48px)', maxWidth: '1100px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>Referidos</h1>

      {/* Event selector */}
      <div style={{ marginBottom: '20px' }}>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ ...inputSt, minWidth: '260px', color: eventId ? '#F5F0E8' : 'rgba(245,240,232,0.35)' }}>
          <option value="">Seleccionar evento</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* Create form */}
      {eventId && (
        <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ ...S, fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)' }}>NOMBRE</span>
            <input value={newForm.name} onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') createCode() }} placeholder="Ej: Influencer A"
              style={{ ...inputSt, minWidth: '180px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ ...S, fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)' }}>DESCUENTO</span>
            <select value={newForm.discount_type} onChange={(e) => setNewForm((p) => ({ ...p, discount_type: e.target.value as NewCodeForm['discount_type'] }))} style={{ ...inputSt }}>
              <option value="">Sin descuento</option>
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto fijo ($)</option>
            </select>
          </div>
          {newForm.discount_type && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ ...S, fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)' }}>
                {newForm.discount_type === 'percentage' ? 'PORCENTAJE' : 'MONTO'}
              </span>
              <input type="number" min="0" value={newForm.discount_value}
                onChange={(e) => setNewForm((p) => ({ ...p, discount_value: e.target.value }))}
                placeholder={newForm.discount_type === 'percentage' ? '10' : '50'}
                style={{ ...inputSt, width: '100px' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ ...S, fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)' }}>USOS MÁX.</span>
            <input type="number" min="0" value={newForm.max_uses}
              onChange={(e) => setNewForm((p) => ({ ...p, max_uses: e.target.value }))}
              placeholder="Ilimitado"
              style={{ ...inputSt, width: '110px' }} />
          </div>
          <button onClick={createCode}
            style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 18px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: '1px' }}>
            + Crear código
          </button>
        </div>
      )}

      {/* Table */}
      {eventId && (
        <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
          ) : codes.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>No hay códigos. Crea el primero.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                  {['Nombre', 'Código', 'Descuento', 'Usos / Máx', 'Estado', 'Link', 'Clicks', 'Registros', 'Conversiones', 'Tasa'].map((h) => (
                    <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const rate = c.clicks > 0 ? Math.round((c.registrations / c.clicks) * 100) : 0
                  return (
                    <tr key={c.id} onClick={() => openDrawer(c)}
                      style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)', cursor: 'pointer' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{c.name ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ ...S, fontSize: '12px', color: '#C9A84C', background: 'rgba(201,168,76,0.06)', padding: '3px 8px', borderRadius: '3px' }}>{c.code}</code>
                      </td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: c.discount_type ? '#C9A84C' : 'rgba(245,240,232,0.3)' }}>{discountLabel(c)}</td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>
                        {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: '2px', background: c.active ? 'rgba(72,187,120,0.1)' : 'rgba(113,128,150,0.1)', color: c.active ? 'rgba(72,187,120,0.9)' : 'rgba(113,128,150,0.6)' }}>
                          {c.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => copyLink(c.code)}
                          style={{ ...S, fontSize: '10px', padding: '4px 10px', background: copied === c.code ? 'rgba(72,187,120,0.08)' : 'rgba(201,168,76,0.04)', border: `0.5px solid rgba(${copied === c.code ? '72,187,120' : '201,168,76'},0.2)`, borderRadius: '3px', color: copied === c.code ? 'rgba(72,187,120,0.8)' : 'rgba(201,168,76,0.6)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {copied === c.code ? 'Copiado ✓' : 'Copiar link'}
                        </button>
                      </td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{c.clicks}</td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{c.registrations}</td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{c.conversions}</td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: rate > 10 ? 'rgba(72,187,120,0.9)' : '#F5F0E8' }}>{rate}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSelected(null)} />
          <div style={{ width: '420px', background: '#0F0F1A', borderLeft: '0.5px solid rgba(201,168,76,0.12)', padding: '32px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8', marginBottom: '4px' }}>{selected.name ?? selected.code}</h2>
                <code style={{ ...S, fontSize: '13px', color: '#C9A84C' }}>{selected.code}</code>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                ['Descuento', discountLabel(selected)],
                ['Usos', `${selected.uses_count}${selected.max_uses ? ` / ${selected.max_uses}` : ''}`],
                ['Registros', selected.registrations],
                ['Conversiones', selected.conversions],
              ].map(([label, value]) => (
                <div key={label as string} style={{ background: 'rgba(201,168,76,0.04)', border: '0.5px solid rgba(201,168,76,0.1)', borderRadius: '6px', padding: '12px 14px' }}>
                  <div style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', marginBottom: '6px' }}>{label}</div>
                  <div style={{ ...S, fontSize: '16px', color: '#F5F0E8' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => copyLink(selected.code)}
                style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 16px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer' }}>
                {copied === selected.code ? 'Copiado ✓' : 'Copiar link'}
              </button>
              <button onClick={() => toggleActive(selected)}
                style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 16px', background: selected.active ? 'rgba(113,128,150,0.08)' : 'rgba(72,187,120,0.08)', border: `0.5px solid rgba(${selected.active ? '113,128,150' : '72,187,120'},0.3)`, borderRadius: '4px', color: selected.active ? 'rgba(113,128,150,0.7)' : 'rgba(72,187,120,0.9)', cursor: 'pointer' }}>
                {selected.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>

            {/* Usage history */}
            <div>
              <div style={{ ...S, fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', marginBottom: '12px' }}>HISTORIAL DE USOS</div>
              {loadingUsage ? (
                <div style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
              ) : usageHistory.length === 0 ? (
                <div style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>Sin usos registrados.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {usageHistory.map((p) => {
                    const reg = p.registrations as any
                    return (
                      <div key={p.id} style={{ background: 'rgba(201,168,76,0.03)', border: '0.5px solid rgba(201,168,76,0.08)', borderRadius: '4px', padding: '10px 12px' }}>
                        <div style={{ ...S, fontSize: '13px', color: '#F5F0E8', marginBottom: '2px' }}>
                          {reg ? `${reg.first_name} ${reg.last_name}` : '—'}
                        </div>
                        <div style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.45)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{reg?.email ?? '—'}</span>
                          <span style={{ color: p.status === 'approved' ? 'rgba(72,187,120,0.8)' : 'rgba(201,168,76,0.6)' }}>
                            {p.amount ? `${p.currency} ${p.amount}` : ''} · {p.status}
                          </span>
                        </div>
                        <div style={{ ...S, fontSize: '10px', color: 'rgba(245,240,232,0.25)', marginTop: '4px' }}>
                          {new Date(p.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

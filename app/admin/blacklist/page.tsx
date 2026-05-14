'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Entry = {
  id: string
  email: string | null
  dni: string | null
  name: string | null
  phone: string | null
  reason: string | null
  internal_notes: string | null
  block_type: 'permanent' | 'temporary'
  expires_at: string | null
  attempt_count: number
  last_attempt_at: string | null
  created_at: string
}

const INIT_FORM: { name: string; email: string; dni: string; phone: string; reason: string; block_type: 'permanent' | 'temporary'; expires_at: string } = { name: '', email: '', dni: '', phone: '', reason: '', block_type: 'permanent', expires_at: '' }

export default function BlacklistPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INIT_FORM)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  const metrics = {
    total: entries.length,
    permanent: entries.filter(e => e.block_type === 'permanent').length,
    temporary: entries.filter(e => e.block_type === 'temporary').length,
    attempts: entries.reduce((s, e) => s + (e.attempt_count || 0), 0),
  }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('blacklist').select('*').order('created_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }

  async function add() {
    if (!form.email && !form.dni) return
    setAdding(true)
    await supabase.from('blacklist').insert({
      email: form.email || null,
      dni: form.dni || null,
      name: form.name || null,
      phone: form.phone || null,
      reason: form.reason || null,
      block_type: form.block_type,
      expires_at: form.block_type === 'temporary' && form.expires_at ? new Date(form.expires_at).toISOString() : null,
    })
    setForm(INIT_FORM)
    setShowModal(false)
    await load()
    setAdding(false)
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar de blacklist?')) return
    await supabase.from('blacklist').delete().eq('id', id)
    setEntries((p) => p.filter((e) => e.id !== id))
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }
  const inputSt: React.CSSProperties = { ...S, fontSize: '13px', padding: '9px 12px', background: '#0A0A0F', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none', width: '100%', boxSizing: 'border-box' as const }
  const labelSt: React.CSSProperties = { ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase' as const, display: 'block', marginBottom: '4px' }

  return (
    <div style={{ padding: 'clamp(24px,4vw,40px) clamp(16px,5vw,48px)', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8' }}>Blacklist</h1>
        <button onClick={() => setShowModal(true)} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 18px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', textTransform: 'uppercase' as const }}>
          + Agregar
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: metrics.total },
          { label: 'Permanentes', value: metrics.permanent },
          { label: 'Temporales', value: metrics.temporary },
          { label: 'Intentos bloq.', value: metrics.attempts },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '28px', color: '#F5F0E8', margin: '0 0 4px' }}>{value}</p>
            <p style={{ ...S, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.5)' }}>{label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>La blacklist está vacía.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                  {['Nombre/Email', 'DNI', 'Tipo', 'Motivo', 'Intentos', 'Fecha', ''].map((h) => (
                    <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {e.name && <p style={{ ...S, fontSize: '13px', color: '#F5F0E8', marginBottom: '2px' }}>{e.name}</p>}
                      <p style={{ ...S, fontSize: e.name ? '11px' : '13px', color: e.name ? 'rgba(245,240,232,0.55)' : '#F5F0E8' }}>{e.email ?? '—'}</p>
                    </td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{e.dni ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...S, fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: e.block_type === 'permanent' ? 'rgba(252,129,74,0.08)' : 'rgba(201,168,76,0.08)', border: `0.5px solid ${e.block_type === 'permanent' ? 'rgba(252,129,74,0.3)' : 'rgba(201,168,76,0.3)'}`, color: e.block_type === 'permanent' ? 'rgba(252,129,74,0.9)' : '#C9A84C' }}>
                        {e.block_type === 'permanent' ? 'PERMANENTE' : 'TEMPORAL'}
                      </span>
                    </td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>{e.reason ?? '—'}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: (e.attempt_count || 0) > 0 ? 'rgba(252,129,74,0.8)' : 'rgba(245,240,232,0.3)' }}>{e.attempt_count || 0}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.35)' }}>{new Date(e.created_at).toLocaleDateString('es-ES')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => remove(e.id)} style={{ ...S, fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '0.5px solid rgba(252,129,74,0.25)', borderRadius: '3px', color: 'rgba(252,129,74,0.6)', cursor: 'pointer' }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8', margin: 0 }}>Agregar a blacklist</h3>

            {[
              { label: 'Nombre (opcional)', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'DNI / ID (opcional)', key: 'dni', type: 'text' },
              { label: 'Teléfono (opcional)', key: 'phone', type: 'tel' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={labelSt}>{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputSt} />
              </div>
            ))}

            <div>
              <label style={labelSt}>Tipo de bloqueo</label>
              <select value={form.block_type} onChange={e => setForm({ ...form, block_type: e.target.value as any })} style={inputSt}>
                <option value="permanent">Permanente</option>
                <option value="temporary">Temporal</option>
              </select>
            </div>

            {form.block_type === 'temporary' && (
              <div>
                <label style={labelSt}>Expira el</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} style={inputSt} />
              </div>
            )}

            <div>
              <label style={labelSt}>Motivo / Notas internas</label>
              <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} style={{ ...inputSt, resize: 'vertical' as const }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={add} disabled={adding || (!form.email && !form.dni)} style={{ flex: 1, ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '12px', background: 'rgba(252,129,74,0.1)', border: '0.5px solid rgba(252,129,74,0.35)', borderRadius: '4px', color: 'rgba(252,129,74,0.9)', cursor: 'pointer', opacity: adding || (!form.email && !form.dni) ? 0.5 : 1, textTransform: 'uppercase' as const }}>
                {adding ? 'Bloqueando...' : 'BLOQUEAR'}
              </button>
              <button onClick={() => setShowModal(false)} style={{ ...S, fontSize: '10px', padding: '12px 18px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

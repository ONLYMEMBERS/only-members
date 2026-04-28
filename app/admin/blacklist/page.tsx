'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Entry = { id: string; email: string | null; dni: string | null; reason: string | null; created_at: string }

export default function BlacklistPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [dni, setDni] = useState('')
  const [reason, setReason] = useState('')
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('blacklist').select('*').order('created_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }

  async function add() {
    if (!email && !dni) return
    setAdding(true)
    await supabase.from('blacklist').insert({ email: email || null, dni: dni || null, reason: reason || null })
    setEmail(''); setDni(''); setReason('')
    await load()
    setAdding(false)
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar de blacklist?')) return
    await supabase.from('blacklist').delete().eq('id', id)
    setEntries((p) => p.filter((e) => e.id !== id))
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }
  const inputSt: React.CSSProperties = { ...S, fontSize: '13px', padding: '8px 12px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none' }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>Blacklist</h1>

      {/* Add form */}
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px', marginBottom: '28px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Agregar entrada</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="email@ejemplo.com" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>DNI</label>
            <input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="12345678" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '160px' }}>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivo</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" style={inputSt} />
          </div>
          <button onClick={add} disabled={adding || (!email && !dni)}
            style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 18px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', textTransform: 'uppercase', opacity: adding || (!email && !dni) ? 0.5 : 1 }}>
            {adding ? 'Agregando...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>La blacklist está vacía.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                {['Email', 'DNI', 'Motivo', 'Fecha', ''].map((h) => (
                  <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{e.email ?? '—'}</td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{e.dni ?? '—'}</td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>{e.reason ?? '—'}</td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.35)' }}>{new Date(e.created_at).toLocaleDateString('es-ES')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => remove(e.id)}
                      style={{ ...S, fontSize: '10px', padding: '4px 10px', background: 'transparent', border: '0.5px solid rgba(252,129,74,0.25)', borderRadius: '3px', color: 'rgba(252,129,74,0.6)', cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

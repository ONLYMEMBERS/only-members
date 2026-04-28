'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Registration } from '@/lib/admin-types'

export default function ArchivePage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [regs, setRegs] = useState<Registration[]>([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('*, cities(name)').in('status', ['archived', 'closed']).order('date_start', { ascending: false }).then(({ data }) => {
      setEvents(data ?? [])
      setLoading(false)
    })
  }, [])

  async function viewEvent(ev: any) {
    setSelectedEvent(ev)
    setLoadingRegs(true)
    const { data } = await supabase.from('registrations').select('*').eq('event_id', ev.id).order('created_at', { ascending: false })
    setRegs((data ?? []) as Registration[])
    setLoadingRegs(false)
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>Archivo</h1>

      {!selectedEvent ? (
        loading ? (
          <div style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {events.map((ev) => (
              <div key={ev.id}
                onClick={() => viewEvent(ev)}
                style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '20px 24px', cursor: 'pointer', transition: 'border-color 200ms' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.12)'}
              >
                <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '20px', color: '#F5F0E8', marginBottom: '6px' }}>{ev.name}</p>
                <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.45)', marginBottom: '4px' }}>{ev.cities?.name} · {ev.country}</p>
                <p style={{ ...S, fontSize: '11px', color: 'rgba(201,168,76,0.5)' }}>
                  {ev.date_start ? new Date(ev.date_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </p>
                <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '2px', background: 'rgba(113,128,150,0.1)', border: '0.5px solid rgba(113,128,150,0.25)', color: 'rgba(113,128,150,0.8)', display: 'inline-block', marginTop: '12px' }}>{ev.status}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <button onClick={() => { setSelectedEvent(null); setRegs([]) }}
            style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Volver al archivo
          </button>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '24px', color: '#F5F0E8', marginBottom: '6px' }}>{selectedEvent.name}</h2>
          <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', marginBottom: '24px' }}>{selectedEvent.cities?.name} · {regs.length} registros</p>

          {loadingRegs ? (
            <div style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando registros...</div>
          ) : (
            <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                    {['Nombre', 'Email', 'País', 'Estado', 'Registro'].map((h) => (
                      <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regs.map((r) => (
                    <tr key={r.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                      <td style={{ ...S, padding: '11px 16px', fontSize: '13px', color: '#F5F0E8' }}>{r.first_name} {r.last_name}</td>
                      <td style={{ ...S, padding: '11px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{r.email}</td>
                      <td style={{ ...S, padding: '11px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{r.country ?? '—'}</td>
                      <td style={{ ...S, padding: '11px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.5)' }}>{r.status}</td>
                      <td style={{ ...S, padding: '11px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.35)' }}>{new Date(r.created_at).toLocaleDateString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

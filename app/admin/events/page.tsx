'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

type Event = {
  id: string; slug: string; name: string; status: string; country: string
  date_start: string | null; created_at: string
  cities?: { name: string } | null
}

const STATUS_OPTS = ['', 'draft', 'soon', 'active', 'closed', 'archived']
const STATUS_COLOR: Record<string, string> = {
  draft: 'rgba(113,128,150,0.8)', soon: '#C9A84C', active: 'rgba(72,187,120,0.9)',
  closed: 'rgba(252,129,74,0.9)', archived: 'rgba(113,128,150,0.6)',
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      let q = supabase.from('events').select('*, cities(name)').order('created_at', { ascending: false })
      if (filterStatus) q = q.eq('status', filterStatus)
      const { data } = await q
      setEvents(data ?? [])
      const cs = Array.from(new Set((data ?? []).map((e: any) => e.cities?.name).filter(Boolean))) as string[]
      setCities(cs)
      setLoading(false)
    }
    load()
  }, [filterStatus])

  const filtered = filterCity
    ? events.filter((e) => (e.cities as any)?.name === filterCity)
    : events

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8' }}>
          Eventos
        </h1>
        <Link
          href="/admin/events/new"
          style={{
            ...S, padding: '10px 20px', fontSize: '10px', letterSpacing: '0.12em',
            background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)',
            borderRadius: '4px', color: '#C9A84C', textDecoration: 'none', textTransform: 'uppercase',
          }}
        >
          + Nuevo evento
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { value: filterStatus, onChange: setFilterStatus, options: STATUS_OPTS, placeholder: 'Todos los estados' },
          { value: filterCity, onChange: setFilterCity, options: ['', ...cities], placeholder: 'Todas las ciudades' },
        ].map((sel, i) => (
          <select
            key={i}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            style={{
              ...S, fontSize: '12px', padding: '8px 14px',
              background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)',
              borderRadius: '4px', color: sel.value ? '#F5F0E8' : 'rgba(245,240,232,0.35)',
              outline: 'none',
            }}
          >
            <option value="">{sel.placeholder}</option>
            {sel.options.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(245,240,232,0.3)', ...S, fontSize: '13px' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(245,240,232,0.3)', ...S, fontSize: '13px' }}>No hay eventos.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                {['Nombre', 'Ciudad', 'Fecha', 'Estado', ''].map((h) => (
                  <th key={h} style={{ ...S, padding: '10px 20px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => (
                <tr
                  key={ev.id}
                  style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)', cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/events/${ev.id}/edit`)}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.03)'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td style={{ ...S, padding: '14px 20px', fontSize: '13px', color: '#F5F0E8' }}>{ev.name}</td>
                  <td style={{ ...S, padding: '14px 20px', fontSize: '13px', color: 'rgba(245,240,232,0.55)' }}>{(ev.cities as any)?.name ?? '—'}</td>
                  <td style={{ ...S, padding: '14px 20px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>
                    {ev.date_start ? new Date(ev.date_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.2)', color: STATUS_COLOR[ev.status] ?? '#F5F0E8' }}>
                      {ev.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Link
                      href={`/admin/events/${ev.id}/edit`}
                      style={{ ...S, fontSize: '11px', color: 'rgba(201,168,76,0.5)', textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Editar →
                    </Link>
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

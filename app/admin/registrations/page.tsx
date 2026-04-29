'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Registration, STATUS_STYLES, statusLabel } from '@/lib/admin-types'
import { RegistrationDrawer } from '@/components/admin/RegistrationDrawer'

const PAGE_SIZE = 50

export default function RegistrationsPage() {
  const [regs, setRegs] = useState<Registration[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEvent, setFilterEvent] = useState('')
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [events, setEvents] = useState<{ id: string; name: string }[]>([])
  const [selected, setSelected] = useState<Registration | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('id, name').order('created_at', { ascending: false }).then(({ data }) => setEvents(data ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filterEvent) params.set('event', filterEvent)
    if (filterStatus.length) params.set('status', filterStatus.join(','))
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/registrations?${params}`)
    const json = await res.json()
    setRegs((json.data ?? []) as Registration[])
    setTotal(json.count ?? 0)
    setLoading(false)
  }, [page, filterEvent, filterStatus, search])

  useEffect(() => { load() }, [load])

  function exportCsv() {
    const rows = [
      ['Nombre', 'Apellido', 'Email', 'País', 'Ciudad', 'DNI', 'Género', 'Instagram', 'Estado', 'Registro'],
      ...regs.map((r) => [r.first_name, r.last_name, r.email, r.country ?? '', r.city ?? '', r.dni ?? '', r.gender ?? '', r.instagram ?? '', r.status, new Date(r.created_at).toLocaleDateString('es-ES')]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `registros-${Date.now()}.csv`
    a.click()
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }
  const ALL_STATUSES = ['pending', 'invited', 'confirmed', 'declined', 'purchased', 'waitlist', 'imported', 'vip']
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8' }}>
          Registros <span style={{ ...S, fontSize: '16px', color: 'rgba(245,240,232,0.35)' }}>({total})</span>
        </h1>
        <button onClick={exportCsv} style={{ ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '8px 16px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.25)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', textTransform: 'uppercase' }}>
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder="Buscar nombre o email..."
          style={{ ...S, fontSize: '12px', padding: '8px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none', width: '220px' }}
        />
        <select value={filterEvent} onChange={(e) => { setFilterEvent(e.target.value); setPage(0) }}
          style={{ ...S, fontSize: '12px', padding: '8px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: filterEvent ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none' }}>
          <option value="">Todos los eventos</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map((s) => {
            const active = filterStatus.includes(s)
            const st = STATUS_STYLES[s]
            return (
              <button key={s} onClick={() => setFilterStatus((p) => active ? p.filter((x) => x !== s) : [...p, s])}
                style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '2px', cursor: 'pointer', background: active ? st.bg : 'transparent', border: `0.5px solid ${active ? st.border : 'rgba(245,240,232,0.12)'}`, color: active ? st.color : 'rgba(245,240,232,0.35)' }}>
                {statusLabel(s)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                {['Nombre', 'Email', 'País', 'Evento', 'Fecha', 'Estado', 'Tags'].map((h) => (
                  <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...S, padding: '48px 16px', textAlign: 'center', fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>
                    No hay registros aún
                  </td>
                </tr>
              )}
              {regs.map((r) => {
                const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending
                return (
                  <tr key={r.id}
                    onClick={() => setSelected(r)}
                    style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.03)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8', whiteSpace: 'nowrap' }}>{r.first_name} {r.last_name}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{r.email}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{r.country ?? '—'}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{(r.events as any)?.name ?? '—'}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.35)', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('es-ES')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', background: st.bg, border: `0.5px solid ${st.border}`, color: st.color }}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(r.tags ?? []).map((t) => (
                          <span key={t} style={{ ...S, fontSize: '9px', padding: '2px 6px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '10px', color: 'rgba(201,168,76,0.7)' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '0.5px solid rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              style={{ ...S, fontSize: '11px', padding: '6px 14px', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '3px', color: page === 0 ? 'rgba(245,240,232,0.2)' : '#C9A84C', cursor: page === 0 ? 'default' : 'pointer' }}>
              ←
            </button>
            <span style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
              style={{ ...S, fontSize: '11px', padding: '6px 14px', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '3px', color: page >= totalPages - 1 ? 'rgba(245,240,232,0.2)' : '#C9A84C', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}>
              →
            </button>
          </div>
        )}
      </div>

      <RegistrationDrawer
        reg={selected}
        onClose={() => setSelected(null)}
        onUpdate={(updated) => {
          setRegs((prev) => prev.map((r) => r.id === updated.id ? updated : r))
          setSelected(updated)
        }}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

const EMAIL_TYPES = ['', 'confirmation', 'invitation', 'purchase', 'location_reveal', 'rsvp_reminder']

const TYPE_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  invitation: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.3)', color: '#C9A84C' },
  confirmation: { bg: 'rgba(72,187,120,0.08)', border: 'rgba(72,187,120,0.3)', color: 'rgba(72,187,120,0.9)' },
  purchase: { bg: 'rgba(99,179,237,0.08)', border: 'rgba(99,179,237,0.3)', color: 'rgba(99,179,237,0.9)' },
  location_reveal: { bg: 'rgba(159,122,234,0.08)', border: 'rgba(159,122,234,0.3)', color: 'rgba(159,122,234,0.9)' },
  rsvp_reminder: { bg: 'rgba(245,240,232,0.06)', border: 'rgba(245,240,232,0.15)', color: 'rgba(245,240,232,0.6)' },
}

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50
  const supabase = createClient()

  useEffect(() => {
    setLoading(true)
    let q = supabase
      .from('email_logs')
      .select('*, registrations(first_name, last_name, email, events(name))')
      .order('sent_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (filterType) q = q.eq('type', filterType)
    q.then(({ data }) => { setLogs(data ?? []); setLoading(false) })
  }, [filterType, page])

  const opened = logs.filter(l => l.opened_at).length
  const openRate = logs.length > 0 ? Math.round((opened / logs.length) * 100) : 0

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: 'clamp(24px,4vw,40px) clamp(16px,5vw,48px)', maxWidth: '1200px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '20px' }}>
        Emails / Logs
      </h1>

      {/* Rate summary */}
      {logs.length > 0 && (
        <div style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)', marginBottom: '20px' }}>
          <span style={{ color: '#C9A84C' }}>{openRate}% tasa de apertura</span>
          <span style={{ color: 'rgba(245,240,232,0.25)', margin: '0 8px' }}>·</span>
          {opened} de {logs.length} abiertos
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0) }}
          style={{ ...S, fontSize: '12px', padding: '8px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: filterType ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none' }}>
          <option value="">Todos los tipos</option>
          {EMAIL_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ ...S, fontSize: '14px', color: 'rgba(245,240,232,0.4)', marginBottom: '8px' }}>No hay emails registrados todavía.</p>
            <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.2)', lineHeight: 1.6 }}>
              Los logs aparecen aquí cuando se envían invitaciones, confirmaciones y pagos.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                  {['Destinatario', 'Tipo', 'Evento', 'Enviado', 'Abierto', 'Estado'].map((h) => (
                    <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const reg = log.registrations
                  const tc = TYPE_COLORS[log.type] ?? TYPE_COLORS.rsvp_reminder
                  return (
                    <tr key={log.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ ...S, fontSize: '13px', color: '#F5F0E8', marginBottom: '2px' }}>{reg?.first_name} {reg?.last_name}</p>
                        <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.45)' }}>{reg?.email}</p>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', background: tc.bg, border: `0.5px solid ${tc.border}`, color: tc.color }}>{log.type}</span>
                      </td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{reg?.events?.name ?? '—'}</td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)', whiteSpace: 'nowrap' as const }}>
                        {new Date(log.sent_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: log.opened_at ? 'rgba(72,187,120,0.8)' : 'rgba(245,240,232,0.25)' }}>
                        {log.opened_at ? `✓ ${new Date(log.opened_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ ...S, fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: 'rgba(72,187,120,0.08)', border: '0.5px solid rgba(72,187,120,0.2)', color: 'rgba(72,187,120,0.7)' }}>
                          {log.status ?? 'sent'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {logs.length === PAGE_SIZE && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          {page > 0 && <button onClick={() => setPage(p => p - 1)} style={{ ...S, fontSize: '11px', padding: '8px 16px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer' }}>← Anterior</button>}
          <button onClick={() => setPage(p => p + 1)} style={{ ...S, fontSize: '11px', padding: '8px 16px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer' }}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}

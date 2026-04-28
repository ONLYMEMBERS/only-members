'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

const EMAIL_TYPES = ['', 'confirmation', 'invitation', 'purchase', 'location_reveal', 'rsvp_reminder']

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setLoading(true)
    let q = supabase
      .from('email_logs')
      .select('*, registrations(first_name, last_name, email, events(name))')
      .order('sent_at', { ascending: false })
      .limit(200)
    if (filterType) q = q.eq('type', filterType)
    q.then(({ data }) => { setLogs(data ?? []); setLoading(false) })
  }, [filterType])

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1200px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '28px' }}>Emails / Logs</h1>

      <div style={{ marginBottom: '20px' }}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          style={{ ...S, fontSize: '12px', padding: '8px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: filterType ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none' }}>
          <option value="">Todos los tipos</option>
          {EMAIL_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                return (
                  <tr key={log.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ ...S, fontSize: '13px', color: '#F5F0E8', marginBottom: '2px' }}>{reg?.first_name} {reg?.last_name}</p>
                      <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.45)' }}>{reg?.email}</p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', color: '#C9A84C' }}>{log.type}</span>
                    </td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{reg?.events?.name ?? '—'}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{new Date(log.sent_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: log.opened_at ? 'rgba(72,187,120,0.8)' : 'rgba(245,240,232,0.25)' }}>
                      {log.opened_at ? new Date(log.opened_at).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...S, fontSize: '9px', padding: '2px 8px', borderRadius: '2px', background: 'rgba(72,187,120,0.08)', border: '0.5px solid rgba(72,187,120,0.2)', color: 'rgba(72,187,120,0.7)' }}>
                        {log.status}
                      </span>
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
}

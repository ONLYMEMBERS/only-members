'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Message = {
  id: string
  name: string
  email: string
  message: string
  event_related: string | null
  status: string
  created_at: string
}

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Message | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMessages((data ?? []) as Message[])
        setLoading(false)
      })
  }, [])

  const filtered = messages.filter((m) => !statusFilter || m.status === statusFilter)
  const unreadCount = messages.filter((m) => m.status === 'unread').length

  async function markRead(id: string) {
    await supabase.from('support_messages').update({ status: 'read' }).eq('id', id)
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'read' } : m))
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: 'read' } : prev)
  }

  const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
    unread: { bg: 'rgba(201,168,76,0.1)', color: '#C9A84C', label: 'Sin leer' },
    read: { bg: 'rgba(113,128,150,0.1)', color: 'rgba(113,128,150,0.7)', label: 'Leído' },
    responded: { bg: 'rgba(72,187,120,0.1)', color: 'rgba(72,187,120,0.9)', label: 'Respondido' },
  }

  return (
    <div style={{ padding: 'clamp(24px,4vw,40px) clamp(16px,5vw,48px)', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8' }}>Soporte</h1>
        {unreadCount > 0 && (
          <span style={{ ...S, fontSize: '11px', padding: '3px 10px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '10px', color: '#C9A84C' }}>
            {unreadCount} sin leer
          </span>
        )}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '20px' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...S, fontSize: '12px', padding: '8px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none', appearance: 'none' }}>
          <option value="">Todos los mensajes</option>
          <option value="unread">Sin leer</option>
          <option value="read">Leídos</option>
          <option value="responded">Respondidos</option>
        </select>
      </div>

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>Sin mensajes.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                {['Nombre', 'Email', 'Evento', 'Mensaje', 'Fecha', 'Estado'].map((h) => (
                  <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const badge = STATUS_BADGE[m.status] ?? STATUS_BADGE.read
                return (
                  <tr key={m.id} onClick={() => setSelected(m)} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)', cursor: 'pointer', background: m.status === 'unread' ? 'rgba(201,168,76,0.02)' : 'transparent' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = m.status === 'unread' ? 'rgba(201,168,76,0.02)' : 'transparent' }}>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8', fontWeight: m.status === 'unread' ? 400 : 300 }}>{m.name}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{m.email}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{m.event_related ?? 'General'}</td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.6)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.message}
                    </td>
                    <td style={{ ...S, padding: '12px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.35)', whiteSpace: 'nowrap' }}>
                      {new Date(m.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: '2px', background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSelected(null)} />
          <div style={{ width: '400px', background: '#0F0F1A', borderLeft: '0.5px solid rgba(201,168,76,0.12)', padding: '32px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8' }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            <div style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>
              <p>{selected.email}</p>
              <p style={{ marginTop: '4px' }}>Evento: {selected.event_related ?? 'General'}</p>
              <p style={{ marginTop: '4px' }}>{new Date(selected.created_at).toLocaleString('es-ES')}</p>
            </div>
            <div style={{ ...S, fontSize: '14px', color: '#F5F0E8', lineHeight: 1.6, whiteSpace: 'pre-wrap', borderTop: '0.5px solid rgba(201,168,76,0.1)', paddingTop: '16px' }}>
              {selected.message}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selected.status !== 'read' && (
                <button onClick={() => markRead(selected.id)}
                  style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 16px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer' }}>
                  Marcar leído
                </button>
              )}
              <a href={`mailto:${selected.email}?subject=Re: tu mensaje a Only Members`}
                style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 16px', background: 'rgba(72,187,120,0.08)', border: '0.5px solid rgba(72,187,120,0.3)', borderRadius: '4px', color: 'rgba(72,187,120,0.9)', textDecoration: 'none' }}>
                Responder por email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

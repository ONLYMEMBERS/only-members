'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ReferralCode } from '@/lib/admin-types'

function generateCode(len = 6) {
  return Math.random().toString(36).substring(2, 2 + len).toUpperCase()
}

export default function ReferralsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [codes, setCodes] = useState<ReferralCode[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const supabase = createClient()

  const currentEvent = events.find((e) => e.id === eventId)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onlymembers.com'

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

  async function createCode() {
    if (!eventId || !newName.trim()) return
    const code = generateCode()
    const { data } = await supabase.from('referral_codes').insert({ event_id: eventId, code, name: newName.trim() }).select().single()
    if (data) setCodes((p) => [data as ReferralCode, ...p])
    setNewName('')
  }

  function copyLink(code: string) {
    const slug = currentEvent?.slug ?? ''
    const link = `${siteUrl}/events/${slug}?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1000px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>Referidos</h1>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)}
          style={{ ...S, fontSize: '13px', padding: '10px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: eventId ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none', minWidth: '260px' }}>
          <option value="">Seleccionar evento</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        {eventId && (
          <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') createCode() }}
              placeholder="Nombre del código..."
              style={{ flex: 1, ...S, fontSize: '13px', padding: '10px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none' }} />
            <button onClick={createCode}
              style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 18px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              + Crear código
            </button>
          </div>
        )}
      </div>

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
                  {['Nombre', 'Código', 'Link', 'Clicks', 'Registros', 'Conversiones', 'Tasa'].map((h) => (
                    <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const rate = c.clicks > 0 ? Math.round((c.registrations / c.clicks) * 100) : 0
                  return (
                    <tr key={c.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                      <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{c.name ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ ...S, fontSize: '12px', color: '#C9A84C', background: 'rgba(201,168,76,0.06)', padding: '3px 8px', borderRadius: '3px' }}>{c.code}</code>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
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
    </div>
  )
}

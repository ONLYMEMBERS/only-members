'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

const GOLD = '#C9A84C'
const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

type CheckinFeed = {
  id: string
  scanned_at: string
  attendee_name: string
  attendee_email: string
  attendee_dni: string | null
  scanner_name: string | null
  scanner_email: string | null
  is_member: boolean
  result: string
}

type ScannerRow = {
  id: string
  name: string
  email: string
  event_id: string | null
  active: boolean
  last_scan_at: string | null
  scans_count: number
  events?: { name: string }
}

type Metrics = { total: number; ingresaron: number; members: number }

function isActive(lastScan: string | null): boolean {
  if (!lastScan) return false
  return Date.now() - new Date(lastScan).getTime() < 5 * 60 * 1000
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function CheckinCard({ item, collapsed }: { item: CheckinFeed; collapsed: boolean }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 10) }, [])

  if (collapsed) return null

  const isOk = item.result === 'valid'
  const isMember = item.is_member && isOk

  if (isMember) {
    return (
      <div style={{
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        opacity: visible ? 1 : 0,
        transition: 'all 300ms ease',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.04))',
        borderLeft: `2px solid ${GOLD}`,
        borderRadius: '6px', padding: '14px 16px',
        marginBottom: '8px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>♛</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                ...S, fontSize: '9px', letterSpacing: '0.15em',
                color: GOLD, fontWeight: 500,
              }}>MEMBER</span>
            </div>
            <p style={{
              fontFamily: 'var(--font-cormorant)', fontWeight: 300,
              fontSize: '18px', color: '#F5F0E8', margin: '0 0 4px',
            }}>
              {item.attendee_name}
            </p>
            {item.attendee_dni && (
              <p style={{ ...S, fontSize: '11px', color: `rgba(201,168,76,0.7)`, margin: 0 }}>
                {item.attendee_dni} · {formatTime(item.scanned_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isOk) {
    return (
      <div style={{
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        opacity: visible ? 1 : 0,
        transition: 'all 300ms ease',
        background: 'rgba(34,197,94,0.06)',
        borderLeft: '2px solid #22c55e',
        borderRadius: '6px', padding: '12px 16px', marginBottom: '8px',
        display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <span style={{ color: '#22c55e', fontSize: '16px', marginTop: '2px' }}>✓</span>
        <div style={{ flex: 1 }}>
          <p style={{ ...S, fontSize: '14px', color: '#F5F0E8', margin: '0 0 3px' }}>
            {item.attendee_name}
          </p>
          <p style={{ ...S, fontSize: '11px', color: `rgba(201,168,76,0.6)`, margin: '0 0 2px' }}>
            {item.attendee_dni ? `${item.attendee_dni} · ` : ''}{formatTime(item.scanned_at)}
          </p>
          {item.scanner_email && (
            <p style={{ ...S, fontSize: '10px', color: 'rgba(245,240,232,0.3)', margin: 0 }}>
              {item.scanner_email}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      transform: visible ? 'translateY(0)' : 'translateY(-20px)',
      opacity: visible ? 1 : 0,
      transition: 'all 300ms ease',
      background: 'rgba(239,68,68,0.06)',
      borderLeft: '2px solid #ef4444',
      borderRadius: '6px', padding: '12px 16px', marginBottom: '8px',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <span style={{ color: '#ef4444', fontSize: '16px', marginTop: '2px' }}>✗</span>
      <div>
        <p style={{ ...S, fontSize: '13px', color: 'rgba(239,68,68,0.8)', margin: '0 0 3px' }}>
          {item.result === 'duplicate' ? 'Ya ingresó' :
           item.result === 'wrong_event' ? 'Evento incorrecto' :
           item.result === 'not_found' ? 'No encontrado' : 'Inválido'}
        </p>
        <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.35)', margin: 0 }}>
          {formatTime(item.scanned_at)}
          {item.scanner_name ? ` · ${item.scanner_name}` : ''}
        </p>
      </div>
    </div>
  )
}

export default function DoorPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [cityFilter, setCityFilter] = useState('')
  const [eventId, setEventId] = useState('')
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, ingresaron: 0, members: 0 })
  const [activeScanners, setActiveScanners] = useState(0)
  const [feed, setFeed] = useState<CheckinFeed[]>([])
  const [scanners, setScanners] = useState<ScannerRow[]>([])
  const [scannersLoading, setScannersLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalForm, setModalForm] = useState({ name: '', email: '', event_id: '' })
  const [modalSaving, setModalSaving] = useState(false)
  const [collapsedBefore, setCollapsedBefore] = useState(false)
  const channelRef = useRef<any>(null)

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('id, name, city_id, cities(id, name, slug)').in('status', ['active', 'soon', 'closed']).order('date_start', { ascending: false }),
      supabase.from('cities').select('id, name').order('name'),
    ]).then(([evRes, cityRes]) => {
      setEvents(evRes.data ?? [])
      setCities(cityRes.data ?? [])
    })
  }, [])

  const loadScanners = useCallback(async () => {
    setScannersLoading(true)
    const res = await fetch('/api/admin/scanner-permissions')
    const { data } = await res.json()
    setScanners(data ?? [])
    setScannersLoading(false)
  }, [])

  useEffect(() => { loadScanners() }, [loadScanners])

  useEffect(() => {
    if (!eventId) { setFeed([]); setMetrics({ total: 0, ingresaron: 0, members: 0 }); return }

    // Load initial metrics
    Promise.all([
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId).in('status', ['confirmed', 'vip', 'member', 'purchased']),
      supabase.from('door_checkins').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('result', 'valid'),
      supabase.from('door_checkins').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('is_member', true).eq('result', 'valid'),
    ]).then(([total, ingresaron, members]) => {
      setMetrics({
        total: total.count ?? 0,
        ingresaron: ingresaron.count ?? 0,
        members: members.count ?? 0,
      })
    })

    // Load initial feed
    supabase
      .from('door_checkins')
      .select('*')
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setFeed((data ?? []) as CheckinFeed[]))

    // Set up realtime
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`door-admin-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'door_checkins',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        const newCheckin = payload.new as CheckinFeed
        setFeed((prev) => [newCheckin, ...prev])
        if (newCheckin.result === 'valid') {
          setMetrics((prev) => ({
            ...prev,
            ingresaron: prev.ingresaron + 1,
            members: newCheckin.is_member ? prev.members + 1 : prev.members,
          }))
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setActiveScanners(Object.keys(state).length)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [eventId])

  const filteredEvents = cityFilter
    ? events.filter((e) => (e.cities as any)?.id === cityFilter)
    : events

  const recentFeed = feed.filter((f) => f.scanned_at >= twoHoursAgo)
  const oldFeed = feed.filter((f) => f.scanned_at < twoHoursAgo)

  async function saveScanner() {
    if (!modalForm.name || !modalForm.email) return
    setModalSaving(true)
    await fetch('/api/admin/scanner-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modalForm),
    })
    setShowModal(false)
    setModalForm({ name: '', email: '', event_id: '' })
    setModalSaving(false)
    loadScanners()
  }

  async function toggleScanner(s: ScannerRow) {
    await fetch('/api/admin/scanner-permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    })
    setScanners((prev) => prev.map((x) => x.id === s.id ? { ...x, active: !x.active } : x))
  }

  async function deleteScanner(id: string) {
    if (!confirm('¿Eliminar scanner?')) return
    await fetch(`/api/admin/scanner-permissions?id=${id}`, { method: 'DELETE' })
    setScanners((prev) => prev.filter((x) => x.id !== id))
  }

  const metricCards = [
    { label: 'TOTAL INVITADOS', value: metrics.total, color: 'rgba(245,240,232,0.7)' },
    { label: 'INGRESARON', value: metrics.ingresaron, color: 'rgba(34,197,94,0.8)' },
    { label: 'MEMBERS', value: metrics.members, color: GOLD },
    { label: 'SCANNERES ACTIVOS', value: activeScanners, color: 'rgba(168,85,247,0.8)' },
  ]

  const inputSt: React.CSSProperties = {
    ...S, fontSize: '13px', padding: '9px 12px',
    background: '#0A0A0F', border: '0.5px solid rgba(201,168,76,0.2)',
    borderRadius: '4px', color: '#F5F0E8', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: 'clamp(20px,4vw,40px)', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ ...S, fontSize: '10px', letterSpacing: '0.2em', color: GOLD, marginBottom: '4px' }}>PUERTA</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', margin: 0 }}>
            Control de Acceso
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            style={{ ...inputSt, width: 'auto', colorScheme: 'light', backgroundColor: 'transparent', color: '#F5F0E8' }}
          >
            <option value="">Todas las ciudades</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ ...inputSt, width: 'auto', colorScheme: 'light', backgroundColor: 'transparent', color: '#F5F0E8' }}
          >
            <option value="">Seleccionar evento</option>
            {filteredEvents.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {eventId && (
            <button
              onClick={() => window.open('/scan', '_blank')}
              style={{ ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '9px 18px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '4px', color: GOLD, cursor: 'pointer' }}
            >
              VISTA SCANNER ↗
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {metricCards.map(({ label, value, color }) => (
          <div key={label} style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '20px 16px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '36px', color, margin: '0 0 4px' }}>{value}</p>
            <p style={{ ...S, fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(245,240,232,0.35)', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Left — Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <h2 style={{ ...S, fontSize: '11px', letterSpacing: '0.16em', color: 'rgba(245,240,232,0.6)', margin: 0 }}>ACTIVIDAD EN VIVO</h2>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          </div>

          <div style={{ maxHeight: '680px', overflowY: 'auto' }}>
            {!eventId && (
              <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)', padding: '20px 0' }}>
                Seleccioná un evento para ver la actividad.
              </p>
            )}

            {recentFeed.map((item) => (
              <CheckinCard key={item.id} item={item} collapsed={false} />
            ))}

            {oldFeed.length > 0 && (
              <button
                onClick={() => setCollapsedBefore(!collapsedBefore)}
                style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '4px', padding: '8px 14px', cursor: 'pointer', marginBottom: '8px', width: '100%' }}
              >
                {collapsedBefore
                  ? `📁 ${oldFeed.length} ingresos anteriores`
                  : `▲ Ocultar anteriores (${oldFeed.length})`}
              </button>
            )}

            {!collapsedBefore && oldFeed.map((item) => (
              <CheckinCard key={item.id} item={item} collapsed={false} />
            ))}

            {eventId && feed.length === 0 && (
              <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.2)', padding: '20px 0' }}>
                Sin actividad aún.
              </p>
            )}
          </div>
        </div>

        {/* Right — Scanners */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ ...S, fontSize: '11px', letterSpacing: '0.16em', color: 'rgba(245,240,232,0.6)', margin: 0 }}>SCANNERES</h2>
            <button
              onClick={() => setShowModal(true)}
              style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 14px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '4px', color: GOLD, cursor: 'pointer' }}
            >
              + AUTORIZAR
            </button>
          </div>

          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
            {scannersLoading ? (
              <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)', textAlign: 'center', padding: '32px' }}>Cargando...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                    {['Nombre', 'Estado', 'Último scan', 'Total', ''].map((h) => (
                      <th key={h} style={{ ...S, padding: '10px 12px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.3)', fontWeight: 300 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scanners.map((sc) => {
                    const active = isActive(sc.last_scan_at) && sc.active
                    return (
                      <tr key={sc.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                        <td style={{ padding: '12px' }}>
                          <p style={{ ...S, fontSize: '13px', color: '#F5F0E8', margin: '0 0 2px' }}>{sc.name}</p>
                          <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.35)', margin: 0 }}>{sc.email}</p>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#22c55e' : 'rgba(245,240,232,0.2)', animation: active ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
                            <span style={{ ...S, fontSize: '10px', color: active ? 'rgba(34,197,94,0.8)' : 'rgba(245,240,232,0.3)' }}>
                              {!sc.active ? 'INACT.' : active ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                          </div>
                        </td>
                        <td style={{ ...S, padding: '12px', fontSize: '11px', color: 'rgba(245,240,232,0.35)' }}>
                          {sc.last_scan_at ? new Date(sc.last_scan_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ ...S, padding: '12px', fontSize: '13px', color: 'rgba(245,240,232,0.5)' }}>
                          {sc.scans_count}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => toggleScanner(sc)}
                              style={{ ...S, fontSize: '9px', padding: '4px 10px', background: sc.active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `0.5px solid rgba(${sc.active ? '239,68,68' : '34,197,94'},0.25)`, borderRadius: '3px', color: sc.active ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)', cursor: 'pointer' }}
                            >
                              {sc.active ? 'Desact.' : 'Activar'}
                            </button>
                            <button
                              onClick={() => deleteScanner(sc.id)}
                              style={{ ...S, fontSize: '9px', padding: '4px 8px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '3px', color: 'rgba(245,240,232,0.3)', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {scanners.length === 0 && (
                    <tr><td colSpan={5} style={{ ...S, padding: '32px', textAlign: 'center', fontSize: '13px', color: 'rgba(245,240,232,0.2)' }}>Sin scanneres autorizados.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Autorizar scanner */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.25)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8', margin: 0 }}>Autorizar Scanner</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <div>
              <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>NOMBRE</label>
              <input value={modalForm.name} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} placeholder="Nombre del scanner" style={inputSt} />
            </div>
            <div>
              <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>EMAIL</label>
              <input type="email" value={modalForm.email} onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })} placeholder="email@ejemplo.com" style={inputSt} />
            </div>
            <div>
              <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>EVENTO ASIGNADO</label>
              <select value={modalForm.event_id} onChange={(e) => setModalForm({ ...modalForm, event_id: e.target.value })} style={{ ...inputSt, colorScheme: 'light' }}>
                <option value="">Sin evento específico</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ ...S, fontSize: '10px', padding: '9px 16px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveScanner} disabled={modalSaving || !modalForm.name || !modalForm.email} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: GOLD, cursor: 'pointer', opacity: modalSaving || !modalForm.name || !modalForm.email ? 0.5 : 1 }}>
                {modalSaving ? 'Guardando...' : 'AUTORIZAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

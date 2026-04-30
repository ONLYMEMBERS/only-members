'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Registration } from '@/lib/admin-types'

type Attendee = Pick<Registration, 'id' | 'first_name' | 'last_name' | 'email' | 'country' | 'instagram' | 'dni' | 'status' | 'checkin_at' | 'rsvp_token'>

type ScanResult =
  | { ok: true; attendee: Attendee; alreadyIn: boolean }
  | { ok: false; reason: 'expired' | 'wrong_event' | 'invalid' | 'not_confirmed' }

function parseQrToken(text: string): { registration_id: string; expires?: number } | { rsvp_token: string } | null {
  try {
    const decoded = JSON.parse(atob(text))
    if (decoded.registration_id) return decoded
  } catch {}
  // Legacy: raw rsvp_token
  if (text.length > 10) return { rsvp_token: text }
  return null
}

export default function DoorPage() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null)
  const scannerRef = useRef<any>(null)
  const scannerDivRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const currentEvent = events.find((e) => e.id === eventId)

  useEffect(() => {
    supabase.from('events').select('id, name, date_start').in('status', ['active', 'soon', 'closed']).order('date_start', { ascending: false }).then(({ data }) => setEvents(data ?? []))
  }, [])

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    supabase
      .from('registrations')
      .select('id, first_name, last_name, email, country, instagram, dni, status, checkin_at, rsvp_token')
      .eq('event_id', eventId)
      .in('status', ['confirmed', 'vip', 'purchased'])
      .order('first_name')
      .then(({ data }) => {
        setAttendees((data ?? []) as Attendee[])
        setLoading(false)
      })
  }, [eventId])

  const filtered = attendees.filter((a) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    )
  })

  async function markEntry(id: string) {
    setCheckinLoading(id)
    const now = new Date().toISOString()
    await supabase.from('registrations').update({ checkin_at: now }).eq('id', id)
    setAttendees((prev) => prev.map((a) => a.id === id ? { ...a, checkin_at: now } : a))
    setCheckinLoading(null)
  }

  async function undoEntry(id: string) {
    setCheckinLoading(id)
    await supabase.from('registrations').update({ checkin_at: null }).eq('id', id)
    setAttendees((prev) => prev.map((a) => a.id === id ? { ...a, checkin_at: null } : a))
    setCheckinLoading(null)
  }

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }, [])

  async function handleQrDecode(text: string) {
    await stopScanner()
    const parsed = parseQrToken(text)

    if (!parsed) {
      setScanResult({ ok: false, reason: 'invalid' })
      setTimeout(() => setScanResult(null), 5000)
      return
    }

    let found: Attendee | undefined

    if ('registration_id' in parsed) {
      // New token format
      if (parsed.expires && Date.now() > parsed.expires) {
        setScanResult({ ok: false, reason: 'expired' })
        setTimeout(() => setScanResult(null), 5000)
        return
      }
      found = attendees.find((a) => a.id === parsed.registration_id)
      if (!found) {
        // Check if registration exists but belongs to different event
        const { data } = await supabase
          .from('registrations')
          .select('id, event_id, status')
          .eq('id', parsed.registration_id)
          .single()
        if (data && data.event_id !== eventId) {
          setScanResult({ ok: false, reason: 'wrong_event' })
        } else if (data && !['confirmed', 'vip', 'purchased'].includes(data.status)) {
          setScanResult({ ok: false, reason: 'not_confirmed' })
        } else {
          setScanResult({ ok: false, reason: 'invalid' })
        }
        setTimeout(() => setScanResult(null), 5000)
        return
      }
    } else {
      // Legacy rsvp_token format
      found = attendees.find((a) => a.rsvp_token === parsed.rsvp_token)
    }

    if (!found) {
      setScanResult({ ok: false, reason: 'wrong_event' })
      setTimeout(() => setScanResult(null), 5000)
      return
    }

    const alreadyIn = !!found.checkin_at
    setScanResult({ ok: true, attendee: found, alreadyIn })
    if (!alreadyIn) markEntry(found.id)
    setTimeout(() => setScanResult(null), 6000)
  }

  async function startScanner() {
    setScanResult(null)
    setScanning(true)

    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      handleQrDecode,
      undefined
    ).catch(() => { setScanning(false); scannerRef.current = null })
  }

  useEffect(() => () => { stopScanner() }, [stopScanner])

  const checkedIn = attendees.filter((a) => a.checkin_at).length
  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

  const ERROR_MESSAGES: Record<string, string> = {
    expired: 'QR expirado — el asistente debe actualizar su código',
    wrong_event: 'Este QR no corresponde a este evento',
    invalid: 'QR inválido o dañado',
    not_confirmed: 'La inscripción no está confirmada',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', padding: '0' }}>
      {/* Header */}
      <div style={{ background: '#0F0F1A', borderBottom: '0.5px solid rgba(201,168,76,0.12)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '20px', color: '#F5F0E8', margin: '0 0 2px 0' }}>
          {currentEvent?.name ?? 'Vista Puerta'}
        </p>
        {eventId && (
          <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.35)', margin: 0 }}>
            {checkedIn} / {attendees.length} ingresaron
          </p>
        )}
      </div>

      <div style={{ padding: '16px 20px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Event selector */}
        {!eventId && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '12px' }}>Seleccionar evento</p>
            {events.map((ev) => (
              <div key={ev.id} onClick={() => setEventId(ev.id)}
                style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '16px 20px', marginBottom: '8px', cursor: 'pointer' }}>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '18px', color: '#F5F0E8', margin: '0 0 4px 0' }}>{ev.name}</p>
                {ev.date_start && (
                  <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.4)', margin: 0 }}>
                    {new Date(ev.date_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {eventId && (
          <>
            {/* Search + QR button */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o email..." autoFocus
                style={{ flex: 1, ...S, fontSize: '15px', padding: '12px 16px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '6px', color: '#F5F0E8', outline: 'none' }} />
              <button onClick={scanning ? stopScanner : startScanner}
                style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '12px 16px', background: scanning ? 'rgba(252,129,74,0.1)' : 'rgba(201,168,76,0.08)', border: `0.5px solid rgba(${scanning ? '252,129,74' : '201,168,76'},0.3)`, borderRadius: '6px', color: scanning ? 'rgba(252,129,74,0.9)' : '#C9A84C', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {scanning ? 'CERRAR' : 'QR'}
              </button>
              <button onClick={() => { setEventId(''); setAttendees([]); setQuery('') }}
                style={{ ...S, fontSize: '10px', padding: '12px 14px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '6px', color: 'rgba(245,240,232,0.3)', cursor: 'pointer' }}>
                ←
              </button>
            </div>

            {/* QR Scanner */}
            {scanning && (
              <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '0.5px solid rgba(201,168,76,0.2)' }}>
                <div id="qr-reader" ref={scannerDivRef} style={{ width: '100%' }} />
              </div>
            )}

            {/* Scan result */}
            {scanResult && (
              scanResult.ok ? (
                <div style={{ marginBottom: '16px', padding: '20px', borderRadius: '8px', background: scanResult.alreadyIn ? 'rgba(201,168,76,0.08)' : 'rgba(72,187,120,0.1)', border: `0.5px solid rgba(${scanResult.alreadyIn ? '201,168,76' : '72,187,120'},0.35)` }}>
                  <div style={{ ...S, fontSize: '18px', color: scanResult.alreadyIn ? '#C9A84C' : 'rgba(72,187,120,0.9)', marginBottom: '8px' }}>
                    {scanResult.alreadyIn ? '⚠ Ya ingresó antes' : '✓ Acceso permitido'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8', marginBottom: '6px' }}>
                    {scanResult.attendee.first_name} {scanResult.attendee.last_name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>{scanResult.attendee.email}</span>
                    {scanResult.attendee.country && (
                      <span style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{scanResult.attendee.country}</span>
                    )}
                    {scanResult.attendee.instagram && (
                      <span style={{ ...S, fontSize: '12px', color: 'rgba(201,168,76,0.6)' }}>@{scanResult.attendee.instagram.replace('@', '')}</span>
                    )}
                    {scanResult.attendee.dni && (
                      <span style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.35)' }}>DNI: {scanResult.attendee.dni}</span>
                    )}
                    <span style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', marginTop: '4px' }}>
                      Status: {scanResult.attendee.status}
                      {scanResult.attendee.checkin_at && ` · Ingresó: ${new Date(scanResult.attendee.checkin_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '16px', padding: '20px', borderRadius: '8px', background: 'rgba(252,129,74,0.08)', border: '0.5px solid rgba(252,129,74,0.3)' }}>
                  <div style={{ ...S, fontSize: '18px', color: 'rgba(252,129,74,0.9)', marginBottom: '4px' }}>✗ Acceso denegado</div>
                  <div style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)' }}>{ERROR_MESSAGES[scanResult.reason]}</div>
                </div>
              )
            )}

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Total', value: attendees.length, color: 'rgba(245,240,232,0.6)' },
                { label: 'Ingresaron', value: checkedIn, color: 'rgba(72,187,120,0.8)' },
                { label: 'Pendientes', value: attendees.length - checkedIn, color: 'rgba(201,168,76,0.7)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.08)', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color, margin: '0 0 2px 0' }}>{value}</p>
                  <p style={{ ...S, fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(245,240,232,0.3)', textTransform: 'uppercase', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Attendee list */}
            {loading ? (
              <div style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)', textAlign: 'center', padding: '32px' }}>Cargando...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filtered.map((a) => {
                  const checked = !!a.checkin_at
                  const isLoading = checkinLoading === a.id
                  return (
                    <div key={a.id} style={{
                      background: checked ? 'rgba(72,187,120,0.06)' : '#0F0F1A',
                      border: `0.5px solid rgba(${checked ? '72,187,120' : '201,168,76'},${checked ? '0.2' : '0.08'})`,
                      borderRadius: '8px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      transition: 'all 300ms',
                    }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: checked ? 'rgba(72,187,120,0.15)' : 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '14px', color: checked ? 'rgba(72,187,120,0.8)' : 'rgba(201,168,76,0.6)' }}>
                          {checked ? '✓' : `${a.first_name[0]}${a.last_name[0] ?? ''}`}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ ...S, fontSize: '14px', color: checked ? 'rgba(72,187,120,0.9)' : '#F5F0E8', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.first_name} {a.last_name}
                        </p>
                        <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.country ?? a.email}
                          {a.status === 'vip' && <span style={{ marginLeft: '8px', color: '#C9A84C' }}>VIP</span>}
                          {a.checkin_at && <span style={{ marginLeft: '8px', color: 'rgba(72,187,120,0.6)' }}>{new Date(a.checkin_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>}
                        </p>
                      </div>
                      <button onClick={() => checked ? undoEntry(a.id) : markEntry(a.id)} disabled={isLoading}
                        style={{
                          ...S, fontSize: '10px', letterSpacing: '0.08em', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap',
                          background: checked ? 'transparent' : 'rgba(72,187,120,0.1)',
                          border: `0.5px solid rgba(${checked ? '245,240,232' : '72,187,120'},${checked ? '0.15' : '0.35'})`,
                          color: checked ? 'rgba(245,240,232,0.3)' : 'rgba(72,187,120,0.9)',
                          opacity: isLoading ? 0.5 : 1,
                        }}>
                        {isLoading ? '...' : checked ? 'DESHACER' : 'INGRESO'}
                      </button>
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)', textAlign: 'center', padding: '32px' }}>
                    {query ? 'Sin resultados.' : 'No hay confirmados para este evento.'}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

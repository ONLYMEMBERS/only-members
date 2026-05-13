'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

const GOLD = '#C9A84C'
const S = { fontFamily: 'Inter, sans-serif', fontWeight: 300 } as const

type ScannerInfo = {
  name: string
  email: string
  event_id: string | null
}

type ScanResult = {
  valid: boolean
  isMember?: boolean
  result?: string
  message?: string
  attendee?: { name: string; email: string; dni?: string }
}

function playMemberSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, audioCtx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + start + 0.05)
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + start + duration)
      osc.start(audioCtx.currentTime + start)
      osc.stop(audioCtx.currentTime + start + duration + 0.1)
    }
    playTone(523.25, 0, 0.4)
    playTone(659.25, 0.15, 0.4)
    playTone(783.99, 0.3, 0.6)
  } catch {}
}

function launchParticles() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particles = Array.from({ length: 50 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 8 - 3,
    life: 1,
    size: Math.random() * 4 + 1,
    alpha: Math.random() * 0.8 + 0.2,
  }))

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let any = false
    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.life -= 0.02
      if (p.life > 0) {
        any = true
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201,168,76,${p.life * p.alpha})`
        ctx.fill()
      }
    })
    if (any) requestAnimationFrame(animate)
    else document.body.removeChild(canvas)
  }
  animate()
}

function ResultOverlay({ result, onDone }: { result: ScanResult; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  useEffect(() => {
    if (result.valid && result.isMember) {
      playMemberSound()
      launchParticles()
    }
  }, [result.valid, result.isMember])

  const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  if (result.valid && result.isMember) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0A0A0F',
        borderTop: '3px solid #C9A84C', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px', textAlign: 'center',
        boxShadow: '0 0 60px rgba(201,168,76,0.4) inset',
        animation: 'fadeInBg 500ms ease',
      }}>
        <style>{`
          @keyframes fadeInBg { from { background: #0A0A0F } to { background: #1a1200 } }
          @keyframes glow { 0%,100%{box-shadow:0 0 60px rgba(201,168,76,0.2)} 50%{box-shadow:0 0 80px rgba(201,168,76,0.5)} }
        `}</style>
        <div style={{
          fontSize: '72px', lineHeight: 1,
          fontFamily: 'Georgia, serif', color: GOLD, marginBottom: '12px',
          textShadow: '0 0 30px rgba(201,168,76,0.8)', zIndex: 2,
        }}>♛</div>
        <p style={{
          ...S, fontSize: '13px', letterSpacing: '0.5em', color: GOLD,
          fontWeight: 600, marginBottom: '16px', zIndex: 2,
        }}>M E M B E R</p>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontWeight: 300,
          fontSize: '32px', color: '#F5F0E8', marginBottom: '8px', zIndex: 2,
        }}>{result.attendee?.name}</h2>
        {result.attendee?.dni && (
          <p style={{ ...S, fontSize: '13px', color: `rgba(201,168,76,0.7)`, marginBottom: '4px', zIndex: 2 }}>
            {result.attendee.dni}
          </p>
        )}
        {result.attendee?.email && (
          <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.5)', marginBottom: '16px', zIndex: 2 }}>
            {result.attendee.email}
          </p>
        )}
        <div style={{ width: '80px', height: '0.5px', background: GOLD, marginBottom: '16px', zIndex: 2 }} />
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.2em', color: GOLD, zIndex: 2 }}>
          ACCESO MEMBER CONFIRMADO
        </p>
        <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', marginTop: '8px', zIndex: 2 }}>{now}</p>
      </div>
    )
  }

  if (result.valid) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.98)',
        borderTop: '3px solid #22c55e', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '64px', color: '#22c55e', lineHeight: 1, marginBottom: '12px' }}>✓</div>
        <p style={{ ...S, fontSize: '12px', letterSpacing: '0.2em', color: '#22c55e', marginBottom: '20px', fontWeight: 500 }}>
          ACCESO VÁLIDO
        </p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: '28px', color: '#F5F0E8', marginBottom: '8px' }}>
          {result.attendee?.name}
        </h2>
        {result.attendee?.dni && (
          <p style={{ ...S, fontSize: '14px', color: `rgba(201,168,76,0.7)`, marginBottom: '4px' }}>
            {result.attendee.dni}
          </p>
        )}
        {result.attendee?.email && (
          <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)', marginBottom: '8px' }}>
            {result.attendee.email}
          </p>
        )}
        <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', marginTop: '8px' }}>{now}</p>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.98)',
      borderTop: '3px solid #ef4444', zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '64px', color: '#ef4444', lineHeight: 1, marginBottom: '12px' }}>✗</div>
      <p style={{ ...S, fontSize: '12px', letterSpacing: '0.2em', color: '#ef4444', marginBottom: '20px', fontWeight: 500 }}>
        ACCESO DENEGADO
      </p>
      <p style={{ ...S, fontSize: '14px', color: 'rgba(245,240,232,0.5)' }}>
        {result.message ?? 'QR inválido'}
      </p>
      <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', marginTop: '8px' }}>{now}</p>
    </div>
  )
}

export default function ScanPage() {
  const supabase = createClient()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [scanner, setScanner] = useState<ScannerInfo | null>(null)
  const [eventName, setEventName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scansToday, setScansToday] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/scan/verify-access')
      .then((r) => r.json())
      .then(({ authorized: ok, scanner: sc, event: ev }) => {
        setAuthorized(ok)
        if (ok) {
          setScanner(sc)
          setEventName(ev?.name ?? '')
        }
      })
  }, [])

  // Presence tracking for realtime
  useEffect(() => {
    if (!scanner?.event_id || !scanner.email) return

    const channel = supabase
      .channel(`door-${scanner.event_id}`, {
        config: { presence: { key: scanner.email } },
      })

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          scanner_email: scanner.email,
          scanner_name: scanner.name,
          event_id: scanner.event_id,
          last_seen: new Date().toISOString(),
        })
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [scanner?.event_id, scanner?.email])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }, [])

  async function handleQr(qrValue: string) {
    await stopScanner()
    if (!scanner?.event_id) return

    const res = await fetch('/api/scan/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrValue,
        eventId: scanner.event_id,
        scannerEmail: scanner.email,
        scannerName: scanner.name,
      }),
    })
    const data = await res.json()
    setResult(data)
    if (data.valid) setScansToday((p) => p + 1)
  }

  async function startScanner() {
    if (!scanner?.event_id) {
      alert('No tenés un evento asignado. Contactá al administrador.')
      return
    }
    setScanning(true)
    const { Html5Qrcode } = await import('html5-qrcode')
    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr
    await qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 220 },
      handleQr,
      undefined,
    ).catch(() => { setScanning(false); scannerRef.current = null })
  }

  useEffect(() => () => { stopScanner() }, [stopScanner])

  if (authorized === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '0.5px solid rgba(201,168,76,0.2)', borderTop: `0.5px solid ${GOLD}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⛔</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: '24px', color: '#F5F0E8', marginBottom: '8px' }}>
            Acceso denegado
          </h2>
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)' }}>
            No tenés acceso al scanner. Contactá al administrador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 0 40px' }}>

      {/* Result overlay */}
      {result && (
        <ResultOverlay result={result} onDone={() => setResult(null)} />
      )}

      {/* Header */}
      <div style={{ width: '100%', padding: '20px 24px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.1)', textAlign: 'center' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.2em', color: GOLD, marginBottom: '4px' }}>
          ONLY MEMBERS SCAN
        </p>
        <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.5)', marginBottom: '2px' }}>
          {scanner?.name}{eventName ? ` · ${eventName}` : ''}
        </p>
        <p style={{ ...S, fontSize: '11px', color: GOLD }}>
          HOY: {scansToday} escaneados
        </p>
      </div>

      {/* Scanner area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', width: '100%', maxWidth: '400px' }}>

        {scanning ? (
          <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid rgba(201,168,76,0.3)', position: 'relative' }}>
              <div id="qr-reader" style={{ width: '100%' }} />
              {/* Corner decorations */}
              {[
                { top: 0, left: 0, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
                { top: 0, right: 0, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
                { bottom: 0, left: 0, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
                { bottom: 0, right: 0, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
              ].map((style, i) => (
                <div key={i} style={{ position: 'absolute', width: '20px', height: '20px', ...style }} />
              ))}
            </div>
            <button
              onClick={stopScanner}
              style={{ width: '100%', padding: '14px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '8px', color: 'rgba(245,240,232,0.5)', ...S, fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer' }}
            >
              CANCELAR
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={startScanner}
              style={{
                width: '120px', height: '120px', borderRadius: '50%',
                border: `1.5px solid ${GOLD}`, background: 'rgba(201,168,76,0.05)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', transition: 'all 200ms ease',
                boxShadow: `0 0 0 0 rgba(201,168,76,0.3)`,
                animation: 'scan-pulse 2s ease-in-out infinite',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="3" height="3" rx="0.5" />
                <rect x="18" y="14" width="3" height="3" rx="0.5" />
                <rect x="14" y="18" width="3" height="3" rx="0.5" />
                <rect x="18" y="18" width="3" height="3" rx="0.5" />
              </svg>
            </button>
            <style>{`
              @keyframes scan-pulse {
                0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.3) }
                50% { box-shadow: 0 0 0 12px rgba(201,168,76,0) }
              }
            `}</style>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)', marginBottom: '8px' }}>
              Tocá para escanear QR
            </p>
            {!scanner?.event_id && (
              <p style={{ ...S, fontSize: '11px', color: 'rgba(239,68,68,0.7)' }}>
                Sin evento asignado — contactá al admin
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

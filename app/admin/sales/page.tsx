'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

type Payment = {
  id: string
  registration_id: string | null
  event_id: string | null
  amount: number
  currency: string
  discount_amount: number
  discount_code: string | null
  status: string
  mp_payment_id: string | null
  paid_at: string | null
  created_at: string
  registrations?: { first_name: string; last_name: string; email: string; country: string | null } | null
  events?: { name: string } | null
}

const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  approved: { bg: 'rgba(72,187,120,0.1)', color: 'rgba(72,187,120,0.9)', border: 'rgba(72,187,120,0.3)' },
  pending: { bg: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: 'rgba(201,168,76,0.3)' },
  rejected: { bg: 'rgba(229,62,62,0.1)', color: 'rgba(229,62,62,0.8)', border: 'rgba(229,62,62,0.3)' },
  expired: { bg: 'rgba(113,128,150,0.1)', color: 'rgba(113,128,150,0.7)', border: 'rgba(113,128,150,0.3)' },
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado', expired: 'Expirado',
}

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const

export default function SalesPage() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('id, name').order('created_at', { ascending: false }).then(({ data }) => setEvents(data ?? []))
  }, [])

  const fetchPayments = useCallback(() => {
    if (!eventId) return
    setLoading(true)
    supabase
      .from('payments')
      .select('*, registrations(first_name, last_name, email, country), events(name)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPayments((data ?? []) as Payment[])
        setLoading(false)
      })
  }, [eventId])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  // Realtime
  useEffect(() => {
    if (!eventId) return
    const channel = supabase.channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchPayments)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId, fetchPayments])

  const filtered = payments.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false
    if (dateFrom && p.created_at < dateFrom) return false
    if (dateTo && p.created_at > dateTo + 'T23:59:59') return false
    return true
  })

  const approved = filtered.filter((p) => p.status === 'approved')
  const totalAmount = approved.reduce((s, p) => s + (p.amount ?? 0), 0)
  const avgAmount = approved.length > 0 ? totalAmount / approved.length : 0
  const pendingCount = filtered.filter((p) => p.status === 'pending').length

  // 30-day chart
  const chartData = (() => {
    const days: Record<string, number> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    approved.forEach((p) => {
      const day = (p.paid_at ?? p.created_at).slice(0, 10)
      if (days[day] !== undefined) days[day] += p.amount
    })
    return Object.entries(days).map(([date, amount]) => ({
      date: date.slice(5),
      amount: Math.round(amount),
    }))
  })()

  function exportCsv() {
    const rows = [
      ['Nombre', 'Email', 'País', 'Evento', 'Monto', 'Moneda', 'Descuento', 'Fecha pago', 'Estado', 'ID MP'],
      ...filtered.map((p) => [
        `${p.registrations?.first_name ?? ''} ${p.registrations?.last_name ?? ''}`.trim(),
        p.registrations?.email ?? '',
        p.registrations?.country ?? '',
        p.events?.name ?? '',
        p.amount,
        p.currency,
        p.discount_amount,
        p.paid_at ? new Date(p.paid_at).toLocaleString('es-ES') : '',
        STATUS_LABEL[p.status] ?? p.status,
        p.mp_payment_id ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ventas_${eventId}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const inputSt: React.CSSProperties = { ...S, fontSize: '12px', padding: '8px 12px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none' }

  return (
    <div style={{ padding: 'clamp(24px,4vw,40px) clamp(16px,5vw,48px)', maxWidth: '1200px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>
        Ventas
      </h1>

      {/* Event selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ ...inputSt, minWidth: '260px', appearance: 'none' }}>
          <option value="">Seleccionar evento</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {eventId && (
          <>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputSt, appearance: 'none' }}>
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...inputSt }} placeholder="Desde" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...inputSt }} placeholder="Hasta" />
            <button onClick={exportCsv} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '8px 16px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              EXPORTAR CSV
            </button>
          </>
        )}
      </div>

      {eventId && (
        <>
          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'TOTAL RECAUDADO', value: `${totalAmount.toLocaleString('es-ES')} ${payments[0]?.currency ?? ''}` },
              { label: 'CANTIDAD DE PAGOS', value: approved.length },
              { label: 'PRECIO PROMEDIO', value: approved.length > 0 ? `${Math.round(avgAmount).toLocaleString('es-ES')}` : '—' },
              { label: 'PENDIENTES', value: pendingCount },
            ].map((m) => (
              <div key={m.label} style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '20px' }}>
                <p style={{ ...S, fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '10px' }}>{m.label}</p>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '28px', color: '#F5F0E8' }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '16px' }}>Últimos 30 días</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(245,240,232,0.3)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(245,240,232,0.3)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '6px', color: '#F5F0E8', fontSize: '12px' }} />
                <Bar dataKey="amount" fill="rgba(201,168,76,0.4)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>Sin pagos encontrados.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                      {['Nombre', 'Email', 'País', 'Monto', 'Descuento', 'Fecha pago', 'Estado', 'ID MP'].map((h) => (
                        <th key={h} style={{ ...S, padding: '10px 14px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const sc = STATUS_COLOR[p.status] ?? STATUS_COLOR.expired
                      return (
                        <tr key={p.id} onClick={() => setSelectedPayment(p)} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)', cursor: 'pointer', transition: 'background 150ms' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.03)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                          <td style={{ ...S, padding: '12px 14px', fontSize: '13px', color: '#F5F0E8', whiteSpace: 'nowrap' }}>
                            {p.registrations?.first_name} {p.registrations?.last_name}
                          </td>
                          <td style={{ ...S, padding: '12px 14px', fontSize: '12px', color: 'rgba(245,240,232,0.55)', whiteSpace: 'nowrap' }}>{p.registrations?.email}</td>
                          <td style={{ ...S, padding: '12px 14px', fontSize: '12px', color: 'rgba(245,240,232,0.55)' }}>{p.registrations?.country ?? '—'}</td>
                          <td style={{ ...S, padding: '12px 14px', fontSize: '13px', color: '#F5F0E8', whiteSpace: 'nowrap' }}>{p.amount.toLocaleString('es-ES')} {p.currency}</td>
                          <td style={{ ...S, padding: '12px 14px', fontSize: '12px', color: 'rgba(245,240,232,0.4)' }}>{p.discount_amount > 0 ? `${p.discount_amount} (${p.discount_code})` : '—'}</td>
                          <td style={{ ...S, padding: '12px 14px', fontSize: '12px', color: 'rgba(245,240,232,0.4)', whiteSpace: 'nowrap' }}>
                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString('es-ES') : '—'}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '2px', background: sc.bg, border: `0.5px solid ${sc.border}`, color: sc.color, whiteSpace: 'nowrap' }}>
                              {STATUS_LABEL[p.status] ?? p.status}
                            </span>
                          </td>
                          <td style={{ ...S, padding: '12px 14px', fontSize: '11px', color: 'rgba(245,240,232,0.3)', fontFamily: 'monospace' }}>{p.mp_payment_id ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Drawer */}
      {selectedPayment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setSelectedPayment(null)} />
          <div style={{ width: '380px', background: '#0F0F1A', borderLeft: '0.5px solid rgba(201,168,76,0.12)', padding: '32px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8' }}>Detalle del pago</h2>
              <button onClick={() => setSelectedPayment(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
            </div>
            {[
              { label: 'Nombre', value: `${selectedPayment.registrations?.first_name ?? ''} ${selectedPayment.registrations?.last_name ?? ''}` },
              { label: 'Email', value: selectedPayment.registrations?.email ?? '—' },
              { label: 'País', value: selectedPayment.registrations?.country ?? '—' },
              { label: 'Monto', value: `${selectedPayment.amount} ${selectedPayment.currency}` },
              { label: 'Descuento', value: selectedPayment.discount_amount > 0 ? `${selectedPayment.discount_amount} (${selectedPayment.discount_code})` : '—' },
              { label: 'Estado', value: STATUS_LABEL[selectedPayment.status] ?? selectedPayment.status },
              { label: 'Fecha pago', value: selectedPayment.paid_at ? new Date(selectedPayment.paid_at).toLocaleString('es-ES') : '—' },
              { label: 'ID MP', value: selectedPayment.mp_payment_id ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ borderBottom: '0.5px solid rgba(201,168,76,0.06)', paddingBottom: '12px' }}>
                <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
                <p style={{ ...S, fontSize: '13px', color: '#F5F0E8', wordBreak: 'break-all' }}>{String(value)}</p>
              </div>
            ))}
            {selectedPayment.mp_payment_id && (
              <a
                href={`https://www.mercadopago.com.ar/activities/payments/${selectedPayment.mp_payment_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '10px 16px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.3)', borderRadius: '4px', color: '#C9A84C', textDecoration: 'none', textAlign: 'center' }}
              >
                VER EN MERCADOPAGO
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { MetricCard } from '@/components/admin/MetricCard'
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis } from 'recharts'

type ChartPoint = { day: string; count: number }
type Preset = 'today' | '7d' | '30d' | 'all'

function formatDay(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function getPresetRange(preset: Preset): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date()
  switch (preset) {
    case 'today': {
      const from = new Date(now); from.setHours(0,0,0,0); return { from, to }
    }
    case '7d': {
      const from = new Date(now); from.setDate(from.getDate() - 7); return { from, to }
    }
    case '30d': {
      const from = new Date(now); from.setDate(from.getDate() - 30); return { from, to }
    }
    case 'all': {
      return { from: new Date('2020-01-01'), to }
    }
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<Preset>('30d')
  const [metrics, setMetrics] = useState({ total: 0, invited: 0, confirmed: 0, revenue: 0, activeEvents: 0, countries: 0 })
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [realtimeCount, setRealtimeCount] = useState(0)
  const supabase = createClient()

  const dateRange = useMemo(() => getPresetRange(preset), [preset])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const fromIso = dateRange.from.toISOString()
      const toIso = dateRange.to.toISOString()

      const [
        { count: total },
        { data: regsRaw },
        { data: activeEvts },
        { data: regsCountry },
        { count: invitedCount },
        { count: confirmedCount },
        { data: payments },
      ] = await Promise.all([
        supabase.from('registrations').select('*', { count: 'exact', head: true }).gte('created_at', fromIso).lte('created_at', toIso),
        supabase.from('registrations').select('created_at').gte('created_at', fromIso).lte('created_at', toIso),
        supabase.from('events').select('id, name, status, cities(name)').in('status', ['active', 'soon']),
        supabase.from('registrations').select('country').gte('created_at', fromIso),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).in('status', ['invited','confirmed','purchased']).gte('created_at', fromIso),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).in('status', ['confirmed','purchased']).gte('created_at', fromIso),
        supabase.from('payments').select('amount').eq('status', 'approved').gte('created_at', fromIso),
      ])

      // Build chart
      const days = preset === 'today' ? 1 : preset === '7d' ? 7 : preset === '30d' ? 30 : 90
      const dayMap: Record<string, number> = {}
      for (let i = Math.min(days, 90) - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        dayMap[d.toISOString().slice(0, 10)] = 0
      }
      for (const r of regsRaw ?? []) {
        const key = r.created_at.slice(0, 10)
        if (key in dayMap) dayMap[key]++
      }
      setChartData(Object.entries(dayMap).map(([day, count]) => ({ day: formatDay(day), count })))

      const revenue = (payments ?? []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      const countries = new Set((regsCountry ?? []).map((r: any) => r.country).filter(Boolean))

      setMetrics({
        total: total ?? 0,
        invited: (invitedCount as any) ?? 0,
        confirmed: (confirmedCount as any) ?? 0,
        revenue,
        activeEvents: activeEvts?.length ?? 0,
        countries: countries.size,
      })
      setEvents(activeEvts ?? [])
      setLoading(false)
    }
    load()
  }, [preset])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registrations' }, () => {
        setRealtimeCount(n => n + 1)
        setMetrics(m => ({ ...m, total: m.total + 1 }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }
  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'today', label: 'HOY' },
    { key: '7d', label: '7 DÍAS' },
    { key: '30d', label: '30 DÍAS' },
    { key: 'all', label: 'TODO' },
  ]

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 5vw, 48px)', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8' }}>
          Dashboard
        </h1>
        {realtimeCount > 0 && (
          <span style={{ ...S, fontSize: '11px', color: 'rgba(72,187,120,0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(72,187,120,0.8)', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            +{realtimeCount} nuevos
          </span>
        )}
      </div>

      {/* Date preset pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {PRESETS.map(({ key, label }) => (
          <button key={key} onClick={() => setPreset(key)} style={{
            ...S, fontSize: '10px', letterSpacing: '0.12em', padding: '7px 16px',
            borderRadius: '20px', cursor: 'pointer',
            background: preset === key ? 'rgba(201,168,76,0.12)' : 'transparent',
            border: `0.5px solid ${preset === key ? 'rgba(201,168,76,0.4)' : 'rgba(245,240,232,0.15)'}`,
            color: preset === key ? '#C9A84C' : 'rgba(245,240,232,0.4)',
            transition: 'all 150ms ease',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Metrics */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '104px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.08)', borderRadius: '8px', animation: 'skeleton-pulse 1.8s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <MetricCard label="Registros" value={metrics.total.toLocaleString()} />
          <MetricCard label="Invitados" value={metrics.invited.toLocaleString()} />
          <MetricCard label="Confirmados" value={metrics.confirmed.toLocaleString()} />
          <MetricCard label="Recaudado" value={metrics.revenue > 0 ? `$${metrics.revenue.toLocaleString()}` : '—'} />
        </div>
      )}

      {/* Chart */}
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px 28px', marginBottom: '32px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '20px' }}>
          Registros por día
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: 'rgba(245,240,232,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.ceil(chartData.length / 8)} />
            <Tooltip contentStyle={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', fontFamily: 'var(--font-inter)', fontSize: '12px', color: '#F5F0E8' }} itemStyle={{ color: '#C9A84C' }} />
            <Line type="monotone" dataKey="count" stroke="#C9A84C" strokeWidth={1.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Active events table */}
      {events.length > 0 && (
        <div className="admin-table-scroll" style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase' }}>
              Eventos activos ({events.length})
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                  {['Nombre', 'Ciudad', 'Estado'].map((h) => (
                    <th key={h} style={{ ...S, padding: '10px 24px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                    <td style={{ ...S, padding: '14px 24px', fontSize: '13px', color: '#F5F0E8' }}>{ev.name}</td>
                    <td style={{ ...S, padding: '14px 24px', fontSize: '13px', color: 'rgba(245,240,232,0.55)' }}>{(ev.cities as any)?.name ?? '—'}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '2px', background: ev.status === 'active' ? 'rgba(72,187,120,0.1)' : 'rgba(201,168,76,0.1)', color: ev.status === 'active' ? 'rgba(72,187,120,0.9)' : '#C9A84C', border: ev.status === 'active' ? '0.5px solid rgba(72,187,120,0.3)' : '0.5px solid rgba(201,168,76,0.3)' }}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

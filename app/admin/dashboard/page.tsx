'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { MetricCard } from '@/components/admin/MetricCard'
import { LineChart, Line, Tooltip, ResponsiveContainer, XAxis } from 'recharts'

type ChartPoint = { day: string; count: number }
type EventRow = { id: string; name: string; status: string; cities?: any; _count?: number }

function formatDay(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ total: 0, activeEvents: 0, countries: 0, conversion: 0 })
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [
        { count: total },
        { data: regsRaw },
        { data: activeEvts },
        { data: regsCountry },
        { data: invited },
        { data: confirmed },
      ] = await Promise.all([
        supabase.from('registrations').select('*', { count: 'exact', head: true }),
        supabase.from('registrations').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('events').select('id, name, status, cities(name)').in('status', ['active', 'soon']),
        supabase.from('registrations').select('country'),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'invited'),
        supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
      ])

      // Build chart — group by day
      const dayMap: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dayMap[d.toISOString().slice(0, 10)] = 0
      }
      for (const r of regsRaw ?? []) {
        const key = r.created_at.slice(0, 10)
        if (key in dayMap) dayMap[key]++
      }
      setChartData(Object.entries(dayMap).map(([day, count]) => ({ day: formatDay(day), count })))

      const countries = new Set((regsCountry ?? []).map((r: any) => r.country).filter(Boolean))
      const invCount = (invited as any)?.count ?? 0
      const confCount = (confirmed as any)?.count ?? 0
      const conversion = invCount > 0 ? Math.round((confCount / invCount) * 100) : 0

      setMetrics({
        total: total ?? 0,
        activeEvents: activeEvts?.length ?? 0,
        countries: countries.size,
        conversion,
      })
      setEvents(activeEvts ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8' }}>
          Dashboard
        </h1>
      </div>

      {/* Metrics */}
      {loading ? (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: 1, height: '104px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.08)', borderRadius: '8px', animation: 'skeleton-pulse 1.8s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <MetricCard label="Registros totales" value={metrics.total.toLocaleString()} />
          <MetricCard label="Eventos activos" value={metrics.activeEvents} />
          <MetricCard label="Países" value={metrics.countries} />
          <MetricCard label="Conversión" value={`${metrics.conversion}%`} sub="invitados → confirmados" />
        </div>
      )}

      {/* Chart */}
      <div
        style={{
          background: '#0F0F1A',
          border: '0.5px solid rgba(201,168,76,0.12)',
          borderRadius: '8px',
          padding: '24px 28px',
          marginBottom: '32px',
        }}
      >
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '20px' }}>
          Registros — últimos 30 días
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: 'rgba(245,240,232,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
            <Tooltip
              contentStyle={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', fontFamily: 'var(--font-inter)', fontSize: '12px', color: '#F5F0E8' }}
              itemStyle={{ color: '#C9A84C' }}
            />
            <Line type="monotone" dataKey="count" stroke="#C9A84C" strokeWidth={1.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Active events table */}
      {events.length > 0 && (
        <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
            <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase' }}>
              Eventos activos
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    <span style={{
                      ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: '2px',
                      background: ev.status === 'active' ? 'rgba(72,187,120,0.1)' : 'rgba(201,168,76,0.1)',
                      color: ev.status === 'active' ? 'rgba(72,187,120,0.9)' : '#C9A84C',
                      border: ev.status === 'active' ? '0.5px solid rgba(72,187,120,0.3)' : '0.5px solid rgba(201,168,76,0.3)',
                    }}>
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

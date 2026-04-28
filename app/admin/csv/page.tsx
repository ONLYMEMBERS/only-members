'use client'

import { useRef, useState } from 'react'
import { useEffect } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase-browser'

type Row = { first_name?: string; last_name?: string; email?: string; country?: string; city?: string; phone?: string; [k: string]: string | undefined }

export default function CsvPage() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventId] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('id, name').order('created_at', { ascending: false }).then(({ data }) => setEvents(data ?? []))
  }, [])

  function parseFile(file: File) {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setRows(res.data.slice(0, 1000)),
    })
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) parseFile(file)
  }

  async function importRows() {
    if (!eventId || !rows.length) return
    setImporting(true)
    setResult(null)

    const emails = rows.map((r) => r.email?.toLowerCase().trim()).filter(Boolean) as string[]
    const { data: existing } = await supabase.from('registrations').select('email').eq('event_id', eventId).in('email', emails)
    const existingSet = new Set((existing ?? []).map((r: any) => r.email))

    const toInsert = rows
      .filter((r) => r.email && r.first_name && !existingSet.has(r.email.toLowerCase().trim()))
      .map((r) => ({
        event_id: eventId,
        first_name: r.first_name!.trim(),
        last_name: r.last_name?.trim() ?? '',
        email: r.email!.toLowerCase().trim(),
        country: r.country?.trim() ?? null,
        city: r.city?.trim() ?? null,
        phone: r.phone?.trim() ?? null,
        status: 'imported',
      }))

    let imported = 0
    if (toInsert.length) {
      const { error } = await supabase.from('registrations').insert(toInsert)
      if (!error) imported = toInsert.length
    }

    setResult({ imported, skipped: rows.length - imported })
    setImporting(false)
  }

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }
  const COLS = ['first_name', 'last_name', 'email', 'country', 'city', 'phone']

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1000px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>Upload CSV</h1>

      <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', marginBottom: '24px' }}>
        Columnas esperadas: <code style={{ color: '#C9A84C', background: 'rgba(201,168,76,0.06)', padding: '2px 6px', borderRadius: '3px' }}>first_name, last_name, email, country, city, phone</code>
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1px dashed rgba(201,168,76,${dragOver ? '0.6' : '0.25'})`,
          borderRadius: '8px', padding: '48px', textAlign: 'center',
          background: dragOver ? 'rgba(201,168,76,0.04)' : 'transparent',
          cursor: 'pointer', marginBottom: '24px', transition: 'all 200ms',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1.2" strokeLinecap="round" style={{ marginBottom: '12px' }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)', marginBottom: '4px' }}>Arrastra tu CSV aquí o haz clic para seleccionar</p>
        {rows.length > 0 && <p style={{ ...S, fontSize: '12px', color: '#C9A84C', marginTop: '8px' }}>{rows.length} filas cargadas</p>}
        <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={onFile} />
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                  {COLS.map((c) => <th key={c} style={{ ...S, padding: '10px 14px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                    {COLS.map((c) => <td key={c} style={{ ...S, padding: '10px 14px', fontSize: '12px', color: r[c] ? '#F5F0E8' : 'rgba(245,240,232,0.2)' }}>{r[c] ?? '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 10 && <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', padding: '10px 14px' }}>...y {rows.length - 10} filas más</p>}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}
              style={{ ...S, fontSize: '13px', padding: '10px 14px', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: eventId ? '#F5F0E8' : 'rgba(245,240,232,0.35)', outline: 'none', minWidth: '240px' }}>
              <option value="">Seleccionar evento</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button disabled={!eventId || importing} onClick={importRows}
              style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', padding: '10px 22px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: eventId ? 'pointer' : 'default', textTransform: 'uppercase', opacity: !eventId || importing ? 0.5 : 1 }}>
              {importing ? 'IMPORTANDO...' : 'IMPORTAR'}
            </button>
          </div>

          {result && (
            <div style={{ marginTop: '16px', padding: '14px 20px', background: 'rgba(72,187,120,0.08)', border: '0.5px solid rgba(72,187,120,0.25)', borderRadius: '6px', ...S, fontSize: '13px', color: 'rgba(72,187,120,0.9)' }}>
              ✓ {result.imported} importados · {result.skipped} duplicados omitidos
            </div>
          )}
        </>
      )}
    </div>
  )
}

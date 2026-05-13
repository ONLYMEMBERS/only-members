'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

type City = { id: string; name: string; slug: string; country: string; active: boolean }

const TABS = ['Ciudades', 'Cuentas de Pago', 'Usuarios y Permisos', 'Notificaciones', 'Email Config'] as const
type Tab = typeof TABS[number]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Ciudades')
  const supabase = createClient()

  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }
  const inputSt: React.CSSProperties = { ...S, fontSize: '13px', padding: '9px 12px', background: '#0A0A0F', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', color: '#F5F0E8', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 5vw, 48px)', maxWidth: '900px' }}>
      <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '32px', color: '#F5F0E8', marginBottom: '32px' }}>Configuración</h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '0.5px solid rgba(201,168,76,0.12)', marginBottom: '32px' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...S, fontSize: '11px', letterSpacing: '0.1em', padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textTransform: 'uppercase', color: tab === t ? '#C9A84C' : 'rgba(245,240,232,0.35)', borderBottom: tab === t ? '1px solid #C9A84C' : '1px solid transparent', marginBottom: '-0.5px' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Ciudades' && <CitiesTab supabase={supabase} S={S} inputSt={inputSt} />}
      {tab === 'Cuentas de Pago' && <PaymentAccountsTab S={S} inputSt={inputSt} />}
      {tab === 'Usuarios y Permisos' && <PermissionsTab S={S} inputSt={inputSt} />}
      {tab === 'Notificaciones' && <NotificationsTab S={S} inputSt={inputSt} />}
      {tab === 'Email Config' && <EmailConfigTab S={S} inputSt={inputSt} />}
    </div>
  )
}

function CitiesTab({ supabase, S, inputSt }: { supabase: any; S: any; inputSt: any }) {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [country, setCountry] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    supabase.from('cities').select('*').order('name').then(({ data }: any) => {
      setCities(data ?? [])
      setLoading(false)
    })
  }, [])

  function autoSlug(v: string) {
    setName(v)
    setSlug(v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  async function addCity() {
    if (!name || !slug || !country) return
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, country }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error desconocido')
      setCities((p) => [...p, json.city])
      setName(''); setSlug(''); setCountry('')
      setFeedback({ ok: true, msg: `"${json.city.name}" agregada correctamente.` })
      setTimeout(() => setFeedback(null), 4000)
    } catch (err: any) {
      setFeedback({ ok: false, msg: err.message ?? 'Error al agregar ciudad.' })
    }
    setSaving(false)
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('cities').update({ active: !active }).eq('id', id)
    setCities((p) => p.map((c) => c.id === id ? { ...c, active: !active } : c))
  }

  return (
    <div>
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Nueva ciudad</p>
        {feedback && (
          <div style={{ ...S, fontSize: '11px', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', background: feedback.ok ? 'rgba(72,187,120,0.08)' : 'rgba(229,62,62,0.08)', border: `0.5px solid rgba(${feedback.ok ? '72,187,120' : '229,62,62'},0.25)`, color: feedback.ok ? 'rgba(72,187,120,0.9)' : 'rgba(229,62,62,0.9)' }}>
            {feedback.msg}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '4px' }}>NOMBRE</label>
            <input value={name} onChange={(e) => autoSlug(e.target.value)} style={inputSt} placeholder="Buenos Aires" />
          </div>
          <div>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '4px' }}>SLUG</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} style={inputSt} placeholder="buenos-aires" />
          </div>
          <div>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '4px' }}>PAÍS</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} style={inputSt} placeholder="Argentina" />
          </div>
          <button onClick={addCity} disabled={saving || !name || !slug || !country}
            style={{ ...S, fontSize: '10px', padding: '9px 18px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', opacity: saving || !name || !slug || !country ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            + Agregar
          </button>
        </div>
      </div>

      <div className="admin-table-scroll" style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                {['Ciudad', 'Slug', 'País', 'Estado'].map((h) => (
                  <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px' }}><code style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{c.slug}</code></td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{c.country}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => toggleActive(c.id, c.active)}
                      style={{ ...S, fontSize: '10px', padding: '4px 12px', borderRadius: '3px', cursor: 'pointer', background: c.active ? 'rgba(72,187,120,0.08)' : 'rgba(113,128,150,0.08)', border: `0.5px solid rgba(${c.active ? '72,187,120' : '113,128,150'},0.25)`, color: c.active ? 'rgba(72,187,120,0.8)' : 'rgba(113,128,150,0.6)' }}>
                      {c.active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'events', label: 'Eventos' },
  { key: 'registrations', label: 'Registros' },
  { key: 'invitations', label: 'Invitaciones' },
  { key: 'confirmed', label: 'Confirmados' },
  { key: 'referrals', label: 'Referidos' },
  { key: 'csv', label: 'Upload CSV' },
  { key: 'logs', label: 'Emails / Logs' },
  { key: 'archive', label: 'Archivo' },
  { key: 'blacklist', label: 'Blacklist' },
  { key: 'door', label: 'Puerta' },
  { key: 'sales', label: 'Ventas' },
  { key: 'members', label: 'Members' },
  { key: 'support', label: 'Soporte' },
  { key: 'system', label: 'Sistema' },
]

type PermRow = {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'director' | 'vendor'
  allowed_sections: string[]
  assigned_event_id: string | null
  active: boolean
  events?: { name: string }
}

function PermissionsTab({ S, inputSt }: { S: any; inputSt: any }) {
  const [perms, setPerms] = useState<PermRow[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<{
    email: string; name: string; role: 'admin' | 'director' | 'vendor'
    allowed_sections: string[]; assigned_event_id: string; active: boolean
  }>({ email: '', name: '', role: 'vendor', allowed_sections: [], assigned_event_id: '', active: true })
  const [saving, setSaving] = useState(false)
  const [fb, setFb] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/admin/permissions').then((r) => r.json()).then(({ data }) => {
      setPerms(data ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
    supabase.from('events').select('id, name').in('status', ['active', 'soon']).then(({ data }) => setEvents(data ?? []))
  }, [])

  function openNew() {
    setEditId(null)
    setForm({ email: '', name: '', role: 'vendor', allowed_sections: [], assigned_event_id: '', active: true })
    setShowModal(true)
  }

  function openEdit(p: PermRow) {
    setEditId(p.id)
    setForm({ email: p.email, name: p.name ?? '', role: p.role, allowed_sections: p.allowed_sections ?? [], assigned_event_id: p.assigned_event_id ?? '', active: p.active })
    setShowModal(true)
  }

  function toggleSection(key: string) {
    setForm((f) => ({
      ...f,
      allowed_sections: f.allowed_sections.includes(key)
        ? f.allowed_sections.filter((s) => s !== key)
        : [...f.allowed_sections, key],
    }))
  }

  async function save() {
    if (!form.email) return
    setSaving(true)
    const method = editId ? 'PATCH' : 'POST'
    const body = editId ? { id: editId, ...form, assigned_event_id: form.assigned_event_id || null } : { ...form, assigned_event_id: form.assigned_event_id || null }
    const res = await fetch('/api/admin/permissions', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.error) {
      setFb(`Error: ${data.error}`)
    } else {
      if (editId) {
        setPerms((p) => p.map((x) => x.id === editId ? data.data : x))
      } else {
        setPerms((p) => [data.data, ...p])
      }
      setShowModal(false)
      setFb('✓ Guardado')
    }
    setSaving(false)
    setTimeout(() => setFb(null), 3000)
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/permissions?id=${id}`, { method: 'DELETE' })
    setPerms((p) => p.map((x) => x.id === id ? { ...x, active: false } : x))
  }

  const roleLabel = (r: string) => r === 'admin' ? 'Admin' : r === 'director' ? 'Director' : 'Vendedor'
  const GOLD = '#C9A84C'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase' }}>USUARIOS Y PERMISOS</p>
        <button onClick={openNew}
          style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 18px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: GOLD, cursor: 'pointer' }}>
          + INVITAR USUARIO
        </button>
      </div>

      {fb && (
        <div style={{ ...S, fontSize: '11px', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px', background: fb.startsWith('Error') ? 'rgba(229,62,62,0.08)' : 'rgba(72,187,120,0.08)', border: `0.5px solid rgba(${fb.startsWith('Error') ? '229,62,62' : '72,187,120'},0.25)`, color: fb.startsWith('Error') ? 'rgba(229,62,62,0.9)' : 'rgba(72,187,120,0.9)' }}>
          {fb}
        </div>
      )}

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                {['Email', 'Nombre', 'Rol', 'Secciones', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((p) => (
                <tr key={p.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{p.email}</td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.5)' }}>{p.name ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...S, fontSize: '9px', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '2px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.2)', color: GOLD }}>
                      {roleLabel(p.role)}
                    </span>
                  </td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '11px', color: 'rgba(245,240,232,0.4)' }}>
                    {p.role === 'admin' ? 'Todo' : p.allowed_sections?.length ? `${p.allowed_sections.length} secc.` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...S, fontSize: '10px', padding: '3px 10px', borderRadius: '3px', background: p.active ? 'rgba(72,187,120,0.08)' : 'rgba(113,128,150,0.08)', border: `0.5px solid rgba(${p.active ? '72,187,120' : '113,128,150'},0.25)`, color: p.active ? 'rgba(72,187,120,0.8)' : 'rgba(113,128,150,0.6)' }}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(p)} style={{ ...S, fontSize: '10px', padding: '4px 12px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '3px', color: GOLD, cursor: 'pointer' }}>Editar</button>
                    {p.active && <button onClick={() => deactivate(p.id)} style={{ ...S, fontSize: '10px', padding: '4px 12px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '3px', color: 'rgba(245,240,232,0.35)', cursor: 'pointer' }}>Desact.</button>}
                  </td>
                </tr>
              ))}
              {perms.length === 0 && (
                <tr><td colSpan={6} style={{ ...S, padding: '32px', textAlign: 'center', fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>Sin usuarios configurados. El acceso principal no requiere configuración.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.25)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8', margin: 0 }}>
                {editId ? 'Editar permisos' : 'Invitar usuario'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <div>
              <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>EMAIL *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@email.com" style={inputSt} disabled={!!editId} />
            </div>
            <div>
              <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>NOMBRE</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" style={inputSt} />
            </div>
            <div>
              <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>ROL</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} style={{ ...inputSt, colorScheme: 'light' }}>
                <option value="admin">Admin (acceso total)</option>
                <option value="director">Director (secciones elegidas)</option>
                <option value="vendor">Vendedor (solo su evento)</option>
              </select>
            </div>
            {form.role === 'director' && (
              <div>
                <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '10px' }}>SECCIONES PERMITIDAS</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {SECTIONS.map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.allowed_sections.includes(key)} onChange={() => toggleSection(key)} style={{ accentColor: GOLD }} />
                      <span style={{ ...S, fontSize: '12px', color: '#F5F0E8' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {form.role === 'vendor' && (
              <div>
                <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', display: 'block', marginBottom: '4px' }}>EVENTO ASIGNADO</label>
                <select value={form.assigned_event_id} onChange={(e) => setForm({ ...form, assigned_event_id: e.target.value })} style={{ ...inputSt, colorScheme: 'light' }}>
                  <option value="">Sin evento específico</option>
                  {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ accentColor: GOLD }} />
              <span style={{ ...S, fontSize: '13px', color: '#F5F0E8' }}>Activo</span>
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ ...S, fontSize: '10px', padding: '9px 16px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.email} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: GOLD, cursor: 'pointer', opacity: saving || !form.email ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : 'GUARDAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationsTab({ S, inputSt }: { S: any; inputSt: any }) {
  const [webhook, setWebhook] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('slack_webhook') ?? ''
    return ''
  })
  const [saved, setSaved] = useState(false)
  const [events, setEvents] = useState({ new_registration: true, confirmed: true, purchased: true })

  function save() {
    localStorage.setItem('slack_webhook', webhook)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Slack Webhook</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/..." style={{ ...inputSt, flex: 1 }} />
          <button onClick={save}
            style={{ ...S, fontSize: '10px', padding: '9px 20px', background: saved ? 'rgba(72,187,120,0.1)' : 'rgba(201,168,76,0.1)', border: `0.5px solid rgba(${saved ? '72,187,120' : '201,168,76'},0.35)`, borderRadius: '4px', color: saved ? 'rgba(72,187,120,0.8)' : '#C9A84C', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
        <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.3)', margin: 0 }}>
          Recibe notificaciones en Slack para eventos clave. Crear en api.slack.com/apps.
        </p>
      </div>

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Eventos a notificar</p>
        {([
          { key: 'new_registration', label: 'Nueva solicitud' },
          { key: 'confirmed', label: 'Asistente confirmado' },
          { key: 'purchased', label: 'Compra realizada' },
        ] as const).map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid rgba(201,168,76,0.06)' }}>
            <span style={{ ...S, fontSize: '13px', color: '#F5F0E8' }}>{label}</span>
            <button onClick={() => setEvents((p) => ({ ...p, [key]: !p[key] }))}
              style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: events[key] ? 'rgba(72,187,120,0.3)' : 'rgba(113,128,150,0.2)', position: 'relative', transition: 'background 200ms' }}>
              <span style={{ position: 'absolute', top: '3px', left: events[key] ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: events[key] ? 'rgba(72,187,120,0.9)' : 'rgba(113,128,150,0.5)', transition: 'left 200ms' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmailConfigTab({ S, inputSt }: { S: any; inputSt: any }) {
  const [from, setFrom] = useState('Only Members <noreply@onlymembers.com>')
  const [replyTo, setReplyTo] = useState('hola@resilio.life')
  const [saved, setSaved] = useState(false)

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const templates = [
    { key: 'confirmation', label: 'Confirmación de solicitud', desc: 'Se envía al registrarse' },
    { key: 'invitation', label: 'Invitación al evento', desc: 'Se envía al cambiar estado a "invited"' },
    { key: 'purchase', label: 'Link de compra', desc: 'Se envía al cambiar estado a "purchased"' },
    { key: 'location_reveal', label: 'Revelación de ubicación', desc: 'Se envía manualmente antes del evento' },
    { key: 'rsvp_reminder', label: 'Recordatorio RSVP', desc: 'Para invitados sin respuesta' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Configuración del remitente</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '4px' }}>FROM</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)} style={inputSt} />
          </div>
          <div>
            <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.5)', display: 'block', marginBottom: '4px' }}>REPLY-TO</label>
            <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} style={inputSt} />
          </div>
        </div>
        <button onClick={save}
          style={{ ...S, fontSize: '10px', padding: '9px 20px', background: saved ? 'rgba(72,187,120,0.1)' : 'rgba(201,168,76,0.1)', border: `0.5px solid rgba(${saved ? '72,187,120' : '201,168,76'},0.35)`, borderRadius: '4px', color: saved ? 'rgba(72,187,120,0.8)' : '#C9A84C', cursor: 'pointer' }}>
          {saved ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', padding: '24px' }}>
        <p style={{ ...S, fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>Templates de email</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {templates.map((t, i) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < templates.length - 1 ? '0.5px solid rgba(201,168,76,0.06)' : 'none' }}>
              <div>
                <p style={{ ...S, fontSize: '13px', color: '#F5F0E8', margin: '0 0 2px 0' }}>{t.label}</p>
                <p style={{ ...S, fontSize: '11px', color: 'rgba(245,240,232,0.35)', margin: 0 }}>{t.desc}</p>
              </div>
              <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '2px', background: 'rgba(72,187,120,0.08)', border: '0.5px solid rgba(72,187,120,0.2)', color: 'rgba(72,187,120,0.7)' }}>
                ACTIVO
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

type PaymentAccount = { id: string; name: string; mp_access_token: string | null; mp_public_key: string | null; city_id: string | null; fee_percentage: number | null; is_main_account: boolean; active: boolean; cities?: { name: string } | null }

function PaymentAccountsTab({ S, inputSt }: { S: any; inputSt: any }) {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', mp_access_token: '', mp_public_key: '', fee_percentage: '', is_main_account: false })
  const [editId, setEditId] = useState<string | null>(null)
  const [fb, setFb] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/payment-accounts').then((r) => r.json()).then((d) => {
      setAccounts(d.accounts ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/payments/test-connection')
      const d = await res.json()
      setTestResult(d.connected ? `✓ Conectado — ${d.account_email}` : `✗ ${d.error ?? 'Error'}`)
    } finally {
      setTesting(false)
    }
  }

  async function save() {
    setSaving(true)
    setFb(null)
    try {
      const url = '/api/admin/payment-accounts'
      const method = editId ? 'PATCH' : 'POST'
      const body = editId ? { id: editId, ...form, fee_percentage: form.fee_percentage ? parseFloat(form.fee_percentage) : null } : { ...form, fee_percentage: form.fee_percentage ? parseFloat(form.fee_percentage) : null }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Error')
      if (editId) {
        setAccounts((p) => p.map((a) => a.id === editId ? d.account : a))
      } else {
        setAccounts((p) => [d.account, ...p])
      }
      setShowModal(false)
      setEditId(null)
      setForm({ name: '', mp_access_token: '', mp_public_key: '', fee_percentage: '', is_main_account: false })
      setFb({ ok: true, msg: 'Guardado correctamente.' })
      setTimeout(() => setFb(null), 4000)
    } catch (e: any) {
      setFb({ ok: false, msg: e.message ?? 'Error al guardar' })
    }
    setSaving(false)
  }

  function openEdit(a: PaymentAccount) {
    setEditId(a.id)
    setForm({
      name: a.name,
      mp_access_token: a.mp_access_token ?? '',
      mp_public_key: a.mp_public_key ?? '',
      fee_percentage: a.fee_percentage?.toString() ?? '',
      is_main_account: a.is_main_account,
    })
    setShowModal(true)
  }

  async function toggleActive(a: PaymentAccount) {
    await fetch('/api/admin/payment-accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, active: !a.active }),
    })
    setAccounts((p) => p.map((x) => x.id === a.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div>
      {fb && (
        <div style={{ ...S, fontSize: '11px', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px', background: fb.ok ? 'rgba(72,187,120,0.08)' : 'rgba(229,62,62,0.08)', border: `0.5px solid rgba(${fb.ok ? '72,187,120' : '229,62,62'},0.25)`, color: fb.ok ? 'rgba(72,187,120,0.9)' : 'rgba(229,62,62,0.9)' }}>
          {fb.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => { setEditId(null); setForm({ name: '', mp_access_token: '', mp_public_key: '', fee_percentage: '', is_main_account: false }); setShowModal(true) }}
            style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 18px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer' }}>
            + VINCULAR NUEVA CUENTA
          </button>
          <button onClick={testConnection} disabled={testing}
            style={{ ...S, fontSize: '10px', padding: '9px 16px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', opacity: testing ? 0.6 : 1 }}>
            {testing ? 'Verificando...' : 'Probar conexión MP'}
          </button>
        </div>
        {testResult && <span style={{ ...S, fontSize: '12px', color: testResult.startsWith('✓') ? 'rgba(72,187,120,0.9)' : 'rgba(229,62,62,0.8)' }}>{testResult}</span>}
      </div>

      <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.3)' }}>Cargando...</div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', ...S, fontSize: '13px', color: 'rgba(245,240,232,0.25)' }}>No hay cuentas vinculadas.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(201,168,76,0.03)' }}>
                {['Nombre', 'Ciudad', 'Fee %', 'Principal', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} style={{ ...S, padding: '10px 16px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(245,240,232,0.35)', fontWeight: 300 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} style={{ borderTop: '0.5px solid rgba(201,168,76,0.06)' }}>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '13px', color: '#F5F0E8' }}>{a.name}</td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{(a.cities as any)?.name ?? '—'}</td>
                  <td style={{ ...S, padding: '12px 16px', fontSize: '12px', color: 'rgba(245,240,232,0.45)' }}>{a.fee_percentage != null ? `${a.fee_percentage}%` : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {a.is_main_account && <span style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '2px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>PRINCIPAL</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...S, fontSize: '10px', padding: '3px 10px', borderRadius: '3px', background: a.active ? 'rgba(72,187,120,0.08)' : 'rgba(113,128,150,0.08)', border: `0.5px solid rgba(${a.active ? '72,187,120' : '113,128,150'},0.25)`, color: a.active ? 'rgba(72,187,120,0.8)' : 'rgba(113,128,150,0.6)' }}>
                      {a.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(a)} style={{ ...S, fontSize: '10px', padding: '4px 12px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '3px', color: '#C9A84C', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => toggleActive(a)} style={{ ...S, fontSize: '10px', padding: '4px 12px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '3px', color: 'rgba(245,240,232,0.35)', cursor: 'pointer' }}>{a.active ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
          <div style={{ background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.25)', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8' }}>{editId ? 'Editar cuenta' : 'Vincular nueva cuenta'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            {[
              { label: 'Nombre de la cuenta *', key: 'name', placeholder: 'Resilio Buenos Aires' },
              { label: 'Access Token de MP', key: 'mp_access_token', placeholder: 'APP_USR-...' },
              { label: 'Public Key de MP', key: 'mp_public_key', placeholder: 'APP_USR-...' },
              { label: 'Fee % (comisión interna)', key: 'fee_percentage', placeholder: '0' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{label}</label>
                <input value={(form as any)[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ ...inputSt, width: '100%', boxSizing: 'border-box' }} />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_main_account} onChange={(e) => setForm((p) => ({ ...p, is_main_account: e.target.checked }))} style={{ accentColor: '#C9A84C' }} />
              <span style={{ ...S, fontSize: '13px', color: '#F5F0E8' }}>Cuenta principal</span>
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ ...S, fontSize: '10px', padding: '9px 16px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '4px', color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.name} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', padding: '9px 20px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', opacity: saving || !form.name ? 0.5 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

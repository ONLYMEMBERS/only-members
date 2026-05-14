'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const TABS = ['Básico', 'Lugar', 'Dress Code', 'Speakers', 'Partners', 'Acceso', 'Visibilidad', 'OG / SEO', 'Notas', 'Pago MP']
const TIMEZONES = [
  'America/Buenos_Aires', 'America/Santiago', 'America/Lima', 'America/Bogota',
  'America/Mexico_City', 'America/New_York', 'America/Los_Angeles',
  'Europe/Madrid', 'Europe/London', 'Europe/Paris',
]
const CURRENCIES = ['USD', 'EUR', 'ARS', 'COP', 'MXN', 'CLP', 'PEN', 'BRL', 'UYU']
const STATUSES = ['draft', 'soon', 'active', 'closed', 'archived']

function toSlug(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

type Speaker = { id: string; name: string; role: string; bio: string; photo: string; link: string; visible: boolean; order_index: number }
type Partner = { id: string; name: string; logo: string; link: string; order_index: number }

type FormData = {
  name: string; subtitle: string; subtitle_en: string; description_es: string; description_en: string
  tagline: string; slug: string; city_id: string; country: string; date_start: string; date_end: string
  timezone: string; location_name: string; location_address: string; location_lat: string; location_lng: string
  secret_location: boolean; cover_image: string; hero_image: string; dress_code: string
  dress_code_images: string[]; capacity: string; price: string; currency: string; purchase_link: string
  purchase_link_expires_at: string; status: string; publish_at: string; close_registrations_at: string
  progress_value: number; og_title: string; og_description: string; internal_notes: string
  payment_account_id: string; payments_enabled: boolean
}

const INIT: FormData = {
  name: '', subtitle: '', subtitle_en: '', description_es: '', description_en: '',
  tagline: '', slug: '', city_id: '', country: '', date_start: '', date_end: '',
  timezone: 'America/Buenos_Aires', location_name: '', location_address: '', location_lat: '', location_lng: '',
  secret_location: false, cover_image: '', hero_image: '', dress_code: '', dress_code_images: [],
  capacity: '', price: '', currency: 'USD', purchase_link: '', purchase_link_expires_at: '',
  status: 'draft', publish_at: '', close_registrations_at: '', progress_value: 0,
  og_title: '', og_description: '', internal_notes: '',
  payment_account_id: '', payments_enabled: false,
}

const inputStyle: React.CSSProperties = {
  background: 'transparent', border: 'none',
  borderBottom: '0.5px solid rgba(201,168,76,0.2)', padding: '10px 0',
  color: '#F5F0E8', fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '14px', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px',
  letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', display: 'block', marginBottom: '6px',
}
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', minHeight: '100px', borderBottom: 'none', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '10px 12px' }
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', cursor: 'pointer', background: '#0F0F1A', borderBottom: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 0 }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>{children}</div>
}

export function EventForm({ eventId }: { eventId?: string }) {
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState<FormData>(INIT)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [cities, setCities] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [paymentAccounts, setPaymentAccounts] = useState<{ id: string; name: string; is_main_account: boolean }[]>([])
  const [uploading, setUploading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const set = (key: keyof FormData) => (v: string | boolean | number) =>
    setForm((p) => ({ ...p, [key]: v }))

  useEffect(() => {
    supabase.from('cities').select('id, name').eq('active', true).then(({ data }) => setCities(data ?? []))
    fetch('/api/admin/payment-accounts').then((r) => r.json()).then((d) => setPaymentAccounts(d.accounts ?? [])).catch(() => {})

    if (eventId) {
      supabase.from('events').select('*').eq('id', eventId).single().then(({ data }) => {
        if (!data) return
        setForm({
          name: data.name ?? '', subtitle: data.subtitle ?? '', subtitle_en: data.subtitle_en ?? '',
          description_es: data.description_es ?? '', description_en: data.description_en ?? '',
          tagline: data.tagline ?? '', slug: data.slug ?? '', city_id: data.city_id ?? '',
          country: data.country ?? '', date_start: data.date_start?.slice(0, 16) ?? '',
          date_end: data.date_end?.slice(0, 16) ?? '', timezone: data.timezone ?? 'America/Buenos_Aires',
          location_name: data.location_name ?? '', location_address: data.location_address ?? '',
          location_lat: data.location_lat?.toString() ?? '', location_lng: data.location_lng?.toString() ?? '',
          secret_location: data.secret_location ?? false, cover_image: data.cover_image ?? '',
          hero_image: data.hero_image ?? '', dress_code: data.dress_code ?? '',
          dress_code_images: data.dress_code_images ?? [], capacity: data.capacity?.toString() ?? '',
          price: data.price?.toString() ?? '', currency: data.currency ?? 'USD',
          purchase_link: data.purchase_link ?? '', purchase_link_expires_at: data.purchase_link_expires_at?.slice(0, 16) ?? '',
          status: data.status ?? 'draft', publish_at: data.publish_at?.slice(0, 16) ?? '',
          close_registrations_at: data.close_registrations_at?.slice(0, 16) ?? '',
          progress_value: data.progress_value ?? 0, og_title: data.og_title ?? '',
          og_description: data.og_description ?? '', internal_notes: data.internal_notes ?? '',
          payment_account_id: data.payment_account_id ?? '', payments_enabled: data.payments_enabled ?? false,
        })
      })
      supabase.from('speakers').select('*').eq('event_id', eventId).order('order_index').then(({ data }) => setSpeakers(data ?? []))
      supabase.from('partners').select('*').eq('event_id', eventId).order('order_index').then(({ data }) => setPartners(data ?? []))
    }
  }, [eventId])

  async function uploadImage(file: File, folder: string): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Upload failed')
    return json.url as string
  }


  async function handleDressCodeImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6 - form.dress_code_images.length)
    if (!files.length) return
    setUploading('dci')
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f, eventId ?? 'new')))
      setForm((p) => ({ ...p, dress_code_images: [...p.dress_code_images, ...urls].slice(0, 6) }))
    } finally {
      setUploading(null)
    }
  }

  async function save(publish = false) {
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        name: form.name, subtitle: form.subtitle || null, subtitle_en: form.subtitle_en || null,
        description_es: form.description_es || null, description_en: form.description_en || null,
        tagline: form.tagline || null, slug: form.slug, city_id: form.city_id || null,
        country: form.country || null, date_start: form.date_start || null, date_end: form.date_end || null,
        timezone: form.timezone, location_name: form.location_name || null, location_address: form.location_address || null,
        location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
        location_lng: form.location_lng ? parseFloat(form.location_lng) : null,
        secret_location: form.secret_location, cover_image: form.cover_image || null,
        hero_image: form.hero_image || null, dress_code: form.dress_code || null,
        dress_code_images: form.dress_code_images.length ? form.dress_code_images : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency, purchase_link: form.purchase_link || null,
        purchase_link_expires_at: form.purchase_link_expires_at || null,
        status: publish ? 'active' : form.status,
        publish_at: form.publish_at || null, close_registrations_at: form.close_registrations_at || null,
        progress_value: form.progress_value, og_title: form.og_title || null,
        og_description: form.og_description || null, internal_notes: form.internal_notes || null,
        payment_account_id: form.payment_account_id || null, payments_enabled: form.payments_enabled,
      }

      const method = eventId ? 'PATCH' : 'POST'
      const body = JSON.stringify({
        ...(eventId ? { id: eventId } : {}),
        payload,
        speakers: speakers.length ? speakers : [],
        partners: partners.length ? partners : [],
      })

      const res = await fetch('/api/admin/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error desconocido')

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      if (!eventId && json.id) router.push(`/admin/events/${json.id}/edit`)
    } catch (err: any) {
      console.error('EventForm save:', err)
      setSaveError(err.message ?? 'Error al guardar. Verificar consola.')
    } finally {
      setSaving(false)
    }
  }

  function addSpeaker() {
    setSpeakers((p) => [...p, { id: crypto.randomUUID(), name: '', role: '', bio: '', photo: '', link: '', visible: false, order_index: p.length }])
  }
  function addPartner() {
    setPartners((p) => [...p, { id: crypto.randomUUID(), name: '', logo: '', link: '', order_index: p.length }])
  }

  const btnStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', letterSpacing: '0.1em',
    padding: '8px 14px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.25)',
    borderRadius: '3px', color: '#C9A84C', cursor: 'pointer',
  }

  function renderTab() {
    switch (tab) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Row>
            <Field label="Nombre *">
              <input style={inputStyle} value={form.name} onChange={(e) => { set('name')(e.target.value); if (!eventId) set('slug')(toSlug(e.target.value)) }} />
            </Field>
            <Field label="Slug *">
              <input style={inputStyle} value={form.slug} onChange={(e) => set('slug')(e.target.value)} />
            </Field>
          </Row>
          <Row>
            <Field label="Subtítulo (ES)"><input style={inputStyle} value={form.subtitle} onChange={(e) => set('subtitle')(e.target.value)} /></Field>
            <Field label="Subtítulo (EN)"><input style={inputStyle} value={form.subtitle_en} onChange={(e) => set('subtitle_en')(e.target.value)} /></Field>
          </Row>
          <Field label="Tagline"><input style={inputStyle} value={form.tagline} onChange={(e) => set('tagline')(e.target.value)} /></Field>
          <Row>
            <Field label="Descripción (ES)"><textarea style={textareaStyle} value={form.description_es} onChange={(e) => set('description_es')(e.target.value)} /></Field>
            <Field label="Descripción (EN)"><textarea style={textareaStyle} value={form.description_en} onChange={(e) => set('description_en')(e.target.value)} /></Field>
          </Row>
        </div>
      )
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Row>
            <Field label="Ciudad">
              <select style={selectStyle} value={form.city_id} onChange={(e) => set('city_id')(e.target.value)}>
                <option value="">Seleccionar</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="País"><input style={inputStyle} value={form.country} onChange={(e) => set('country')(e.target.value)} /></Field>
          </Row>
          <Row>
            <Field label="Fecha inicio"><input style={inputStyle} type="datetime-local" value={form.date_start} onChange={(e) => set('date_start')(e.target.value)} /></Field>
            <Field label="Fecha fin"><input style={inputStyle} type="datetime-local" value={form.date_end} onChange={(e) => set('date_end')(e.target.value)} /></Field>
          </Row>
          <Field label="Timezone">
            <select style={selectStyle} value={form.timezone} onChange={(e) => set('timezone')(e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
          <Row>
            <Field label="Nombre del venue"><input style={inputStyle} value={form.location_name} onChange={(e) => set('location_name')(e.target.value)} /></Field>
            <Field label="Dirección"><input style={inputStyle} value={form.location_address} onChange={(e) => set('location_address')(e.target.value)} /></Field>
          </Row>
          <Row>
            <Field label="Latitud"><input style={inputStyle} value={form.location_lat} onChange={(e) => set('location_lat')(e.target.value)} /></Field>
            <Field label="Longitud"><input style={inputStyle} value={form.location_lng} onChange={(e) => set('location_lng')(e.target.value)} /></Field>
          </Row>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.secret_location} onChange={(e) => set('secret_location')(e.target.checked)}
              style={{ accentColor: '#C9A84C', width: '14px', height: '14px' }} />
            <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '13px', color: '#F5F0E8' }}>Ubicación secreta</span>
          </label>
        </div>
      )
      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Field label="Dress code (texto)">
            <textarea style={textareaStyle} value={form.dress_code} onChange={(e) => set('dress_code')(e.target.value)} />
          </Field>
          <div>
            <label style={labelStyle}>Imágenes moodboard (máx. 6)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {form.dress_code_images.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '0.5px solid rgba(201,168,76,0.2)' }} />
                  <button onClick={() => setForm((p) => ({ ...p, dress_code_images: p.dress_code_images.filter((_, j) => j !== i) }))}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#0A0A0F', border: '0.5px solid rgba(201,168,76,0.3)', color: '#C9A84C', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            {form.dress_code_images.length < 6 && (
              <label style={{ ...btnStyle, display: 'inline-block', cursor: 'pointer' }}>
                {uploading === 'dci' ? 'Subiendo...' : '+ Agregar imágenes'}
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={handleDressCodeImageUpload} />
              </label>
            )}
          </div>
        </div>
      )
      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {speakers.map((sp, i) => (
            <div key={sp.id} style={{ background: 'rgba(201,168,76,0.03)', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <Field label="Nombre">
                  <input style={inputStyle} value={sp.name} onChange={(e) => setSpeakers((p) => p.map((s, j) => j === i ? { ...s, name: e.target.value } : s))} />
                </Field>
                <Field label="Rol">
                  <input style={inputStyle} value={sp.role} onChange={(e) => setSpeakers((p) => p.map((s, j) => j === i ? { ...s, role: e.target.value } : s))} />
                </Field>
              </div>
              <Field label="Bio">
                <textarea style={{ ...textareaStyle, minHeight: '60px' }} value={sp.bio} onChange={(e) => setSpeakers((p) => p.map((s, j) => j === i ? { ...s, bio: e.target.value } : s))} />
              </Field>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: 'rgba(245,240,232,0.6)' }}>
                  <input type="checkbox" checked={sp.visible} onChange={(e) => setSpeakers((p) => p.map((s, j) => j === i ? { ...s, visible: e.target.checked } : s))} style={{ accentColor: '#C9A84C' }} />
                  Visible
                </label>
                <button style={{ ...btnStyle, color: 'rgba(252,129,74,0.7)', borderColor: 'rgba(252,129,74,0.2)', background: 'transparent', marginLeft: 'auto' }} onClick={() => setSpeakers((p) => p.filter((_, j) => j !== i))}>Eliminar</button>
              </div>
            </div>
          ))}
          <button style={btnStyle} onClick={addSpeaker}>+ Agregar speaker</button>
        </div>
      )
      case 4: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {partners.map((pt, i) => (
            <div key={pt.id} style={{ background: 'rgba(201,168,76,0.03)', border: '0.5px solid rgba(201,168,76,0.12)', borderRadius: '6px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
              <Field label="Nombre"><input style={inputStyle} value={pt.name} onChange={(e) => setPartners((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></Field>
              <Field label="Link"><input style={inputStyle} value={pt.link} onChange={(e) => setPartners((p) => p.map((x, j) => j === i ? { ...x, link: e.target.value } : x))} /></Field>
              <button style={{ ...btnStyle, color: 'rgba(252,129,74,0.7)', borderColor: 'rgba(252,129,74,0.2)', background: 'transparent' }} onClick={() => setPartners((p) => p.filter((_, j) => j !== i))}>Eliminar</button>
            </div>
          ))}
          <button style={btnStyle} onClick={addPartner}>+ Agregar partner</button>
        </div>
      )
      case 5: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Row>
            <Field label="Cupo máximo"><input style={inputStyle} type="number" value={form.capacity} onChange={(e) => set('capacity')(e.target.value)} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <Field label="Precio"><input style={inputStyle} type="number" value={form.price} onChange={(e) => set('price')(e.target.value)} /></Field>
              <Field label="Moneda">
                <select style={selectStyle} value={form.currency} onChange={(e) => set('currency')(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </Row>
          <Field label="Link de compra"><input style={inputStyle} value={form.purchase_link} onChange={(e) => set('purchase_link')(e.target.value)} placeholder="https://..." /></Field>
          <Field label="Expiración del link"><input style={inputStyle} type="datetime-local" value={form.purchase_link_expires_at} onChange={(e) => set('purchase_link_expires_at')(e.target.value)} /></Field>
        </div>
      )
      case 6: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Row>
            <Field label="Estado">
              <select style={selectStyle} value={form.status} onChange={(e) => set('status')(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div />
          </Row>
          <Row>
            <Field label="Publicar automáticamente"><input style={inputStyle} type="datetime-local" value={form.publish_at} onChange={(e) => set('publish_at')(e.target.value)} /></Field>
            <Field label="Cerrar registros"><input style={inputStyle} type="datetime-local" value={form.close_registrations_at} onChange={(e) => set('close_registrations_at')(e.target.value)} /></Field>
          </Row>
          <Field label={`Barra de progreso — ${form.progress_value}%`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="range" min={0} max={100} value={form.progress_value}
                onChange={(e) => set('progress_value')(parseInt(e.target.value))}
                style={{ accentColor: '#C9A84C', width: '100%' }} />
              <div style={{ height: '3px', background: 'rgba(201,168,76,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${form.progress_value}%`, background: 'rgba(201,168,76,0.5)', transition: 'width 200ms' }} />
              </div>
            </div>
          </Field>
        </div>
      )
      case 7: return (
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Field label="OG Title"><input style={inputStyle} value={form.og_title} onChange={(e) => set('og_title')(e.target.value)} /></Field>
            <Field label="OG Description"><textarea style={textareaStyle} value={form.og_description} onChange={(e) => set('og_description')(e.target.value)} /></Field>
          </div>
          <div style={{ width: '280px' }}>
            <label style={labelStyle}>Preview</label>
            <div style={{ border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '6px', overflow: 'hidden', background: '#0F0F1A' }}>
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.hero_image ? <img src={form.hero_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '10px', color: 'rgba(245,240,232,0.2)' }}>Sin imagen</span>}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '11px', color: '#F5F0E8', marginBottom: '4px' }}>{form.og_title || form.name || 'Título'}</p>
                <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.4 }}>{form.og_description || form.description_es?.slice(0, 80) || 'Descripción...'}</p>
              </div>
            </div>
          </div>
        </div>
      )
      case 8: return (
        <Field label="Notas internas (nunca visible al público)">
          <textarea style={{ ...textareaStyle, minHeight: '200px' }} value={form.internal_notes} onChange={(e) => set('internal_notes')(e.target.value)} />
        </Field>
      )
      case 9: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.payments_enabled} onChange={(e) => set('payments_enabled')(e.target.checked)}
              style={{ accentColor: '#C9A84C', width: '14px', height: '14px' }} />
            <span style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '13px', color: '#F5F0E8' }}>Activar pagos para este evento</span>
          </label>
          <Field label="Cuenta de pago">
            <select style={selectStyle} value={form.payment_account_id} onChange={(e) => set('payment_account_id')(e.target.value)}>
              <option value="">Usar cuenta principal</option>
              {paymentAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.is_main_account ? ' (principal)' : ''}</option>
              ))}
            </select>
          </Field>
          <Row>
            <Field label="Precio">
              <input style={inputStyle} type="number" min="0" value={form.price} onChange={(e) => set('price')(e.target.value)} />
            </Field>
            <Field label="Moneda">
              <select style={selectStyle} value={form.currency} onChange={(e) => set('currency')(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Row>
        </div>
      )
      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(201,168,76,0.12)', overflowX: 'auto', flexShrink: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.06em',
            padding: '14px 20px', whiteSpace: 'nowrap', background: 'transparent', border: 'none',
            borderBottom: tab === i ? '1.5px solid #C9A84C' : '1.5px solid transparent',
            color: tab === i ? '#C9A84C' : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'color 150ms',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>{renderTab()}</div>

      {/* Footer */}
      <div style={{ padding: '20px 32px', borderTop: '0.5px solid rgba(201,168,76,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {saveError && (
          <div style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', padding: '8px 12px', borderRadius: '4px', background: 'rgba(229,62,62,0.08)', border: '0.5px solid rgba(229,62,62,0.25)', color: 'rgba(229,62,62,0.9)' }}>
            ✕ {saveError}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={() => save(false)} disabled={saving || !form.name || !form.slug}
          style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '10px', letterSpacing: '0.12em', padding: '10px 20px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '4px', color: '#C9A84C', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'GUARDANDO...' : saved ? 'GUARDADO ✓' : 'GUARDAR BORRADOR'}
        </button>
        <button onClick={() => { if (confirm('¿Confirmar publicación?')) save(true) }} disabled={saving || !form.name || !form.slug}
          style={{ fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '10px', letterSpacing: '0.12em', padding: '10px 20px', background: 'rgba(72,187,120,0.08)', border: '0.5px solid rgba(72,187,120,0.35)', borderRadius: '4px', color: 'rgba(72,187,120,0.9)', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          GUARDAR Y PUBLICAR
        </button>
        <button onClick={() => router.push('/admin/events')} style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', color: 'rgba(245,240,232,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
          Volver
        </button>
        </div>
      </div>
    </div>
  )
}

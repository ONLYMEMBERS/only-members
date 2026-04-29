'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Registration, STATUS_STYLES, statusLabel } from '@/lib/admin-types'

const ALL_STATUSES = ['pending', 'invited', 'confirmed', 'declined', 'purchased', 'waitlist', 'imported', 'vip']

interface Props {
  reg: Registration | null
  onClose: () => void
  onUpdate: (reg: Registration) => void
}

export function RegistrationDrawer({ reg, onClose, onUpdate }: Props) {
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [emailLogs, setEmailLogs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!reg) return
    setNotes(reg.internal_notes ?? '')
    setTags(reg.tags ?? [])
    supabase
      .from('email_logs')
      .select('*')
      .eq('registration_id', reg.id)
      .order('sent_at', { ascending: false })
      .then(({ data }) => setEmailLogs(data ?? []))
  }, [reg?.id])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/registrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Error')
    return json.data as Registration
  }

  async function saveNotes() {
    if (!reg) return
    setSaving(true)
    try {
      const updated = await patch(reg.id, { internal_notes: notes })
      onUpdate({ ...reg, ...updated })
    } catch {}
    setSaving(false)
  }

  async function setStatus(status: string) {
    if (!reg) return
    try {
      const updated = await patch(reg.id, { status })
      onUpdate({ ...reg, ...updated })
      showToast('Estado actualizado')
    } catch {}
  }

  async function setVip(is_vip: boolean) {
    if (!reg) return
    try {
      const updated = await patch(reg.id, { is_vip, status: is_vip ? 'vip' : 'confirmed' })
      onUpdate({ ...reg, ...updated })
      showToast('VIP actualizado')
    } catch {}
  }

  async function addBlacklist() {
    if (!reg || !confirm('¿Agregar a blacklist?')) return
    try {
      await supabase.from('blacklist').insert({ email: reg.email, dni: reg.dni, reason: 'Admin action' })
      const updated = await patch(reg.id, { status: 'declined' })
      onUpdate({ ...reg, ...updated })
      showToast('Agregado a blacklist')
    } catch {}
  }

  async function addTag() {
    if (!reg || !newTag.trim()) return
    const updated = [...tags, newTag.trim()]
    try {
      await patch(reg.id, { tags: updated })
      setTags(updated)
      setNewTag('')
      onUpdate({ ...reg, tags: updated })
    } catch {}
  }

  async function removeTag(t: string) {
    if (!reg) return
    const updated = tags.filter((x) => x !== t)
    try {
      await patch(reg.id, { tags: updated })
      setTags(updated)
      onUpdate({ ...reg, tags: updated })
    } catch {}
  }

  const isOpen = !!reg
  const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[400]"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 600, background: 'rgba(201,168,76,0.15)', border: '0.5px solid rgba(201,168,76,0.4)',
          borderRadius: '6px', padding: '10px 20px',
          fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px',
          color: '#C9A84C', letterSpacing: '0.08em', pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 500,
          width: '480px', maxWidth: '100vw',
          background: '#0F0F1A',
          borderLeft: '0.5px solid rgba(201,168,76,0.15)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {!reg ? null : (
          <>
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '0.5px solid rgba(201,168,76,0.1)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-inter)', fontWeight: 500, fontSize: '14px', color: '#C9A84C',
              }}>
                {reg.first_name[0]}{reg.last_name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...S, fontSize: '16px', color: '#F5F0E8', fontWeight: 400 }}>{reg.first_name} {reg.last_name}</p>
                <p style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.5)', marginTop: '2px' }}>{reg.email}</p>
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.3)', cursor: 'pointer', padding: '4px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status selector */}
            <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
              <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '10px' }}>Estado</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ALL_STATUSES.map((s) => {
                  const style = STATUS_STYLES[s] ?? STATUS_STYLES.pending
                  const active = reg.status === s
                  return (
                    <button key={s} onClick={() => setStatus(s)} style={{
                      ...S, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: '2px', cursor: 'pointer',
                      background: active ? style.bg : 'transparent',
                      border: active ? `0.5px solid ${style.border}` : '0.5px solid rgba(245,240,232,0.1)',
                      color: active ? style.color : 'rgba(245,240,232,0.3)',
                    }}>
                      {statusLabel(s)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Profile fields */}
            <div style={{ padding: '20px 24px', borderBottom: '0.5px solid rgba(201,168,76,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                ['Teléfono', reg.phone], ['País', reg.country], ['Ciudad', reg.city],
                ['DNI', reg.dni], ['Género', reg.gender], ['Idioma', reg.language],
                ['Ref code', reg.ref_code], ['Registro', new Date(reg.created_at).toLocaleDateString('es-ES')],
              ].map(([k, v]) => (
                <div key={k}>
                  <p style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>{k}</p>
                  <p style={{ ...S, fontSize: '12px', color: v ? '#F5F0E8' : 'rgba(245,240,232,0.2)' }}>{v || '—'}</p>
                </div>
              ))}
              {reg.instagram && (
                <div>
                  <p style={{ ...S, fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '3px' }}>Instagram</p>
                  <a href={reg.instagram.startsWith('http') ? reg.instagram : `https://instagram.com/${reg.instagram.replace('@', '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ ...S, fontSize: '12px', color: '#C9A84C', textDecoration: 'none' }}>
                    {reg.instagram}
                  </a>
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
              <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '10px' }}>Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {tags.map((t) => (
                  <span key={t} style={{ ...S, fontSize: '10px', padding: '3px 8px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '12px', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t}
                    <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.5)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '12px' }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTag() }}
                  placeholder="Nuevo tag"
                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(201,168,76,0.2)', padding: '6px 0', color: '#F5F0E8', ...S, fontSize: '12px', outline: 'none' }}
                />
                <button onClick={addTag} style={{ ...S, fontSize: '10px', padding: '4px 10px', background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '3px', color: '#C9A84C', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* Notes */}
            <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
              <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '8px' }}>Notas internas</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                style={{ width: '100%', minHeight: '80px', background: 'rgba(201,168,76,0.03)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '4px', padding: '10px 12px', color: '#F5F0E8', ...S, fontSize: '13px', outline: 'none', resize: 'vertical' }}
                placeholder="Notas privadas..."
              />
              {saving && <p style={{ ...S, fontSize: '10px', color: 'rgba(201,168,76,0.4)', marginTop: '4px' }}>Guardando...</p>}
            </div>

            {/* Email logs */}
            {emailLogs.length > 0 && (
              <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
                <p style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '10px' }}>Emails recibidos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {emailLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...S, fontSize: '11px' }}>
                      <span style={{ color: '#F5F0E8' }}>{log.type}</span>
                      <span style={{ color: 'rgba(245,240,232,0.4)' }}>{new Date(log.sent_at).toLocaleDateString('es-ES')}</span>
                      <span style={{ color: log.opened_at ? 'rgba(72,187,120,0.8)' : 'rgba(245,240,232,0.25)', fontSize: '10px' }}>
                        {log.opened_at ? 'Abierto' : 'Enviado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '16px 24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setVip(!reg.is_vip)} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px', background: reg.is_vip ? 'rgba(201,168,76,0.12)' : 'transparent', border: `0.5px solid rgba(201,168,76,${reg.is_vip ? '0.5' : '0.2'})`, borderRadius: '3px', color: '#C9A84C', cursor: 'pointer' }}>
                {reg.is_vip ? '★ VIP' : '☆ Marcar VIP'}
              </button>
              <button onClick={addBlacklist} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 14px', background: 'transparent', border: '0.5px solid rgba(252,129,74,0.2)', borderRadius: '3px', color: 'rgba(252,129,74,0.7)', cursor: 'pointer' }}>
                Blacklist
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

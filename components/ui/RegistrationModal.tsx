'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { Event } from '@/lib/types'
import { countries } from '@/lib/countries'

interface Props {
  isOpen: boolean
  onClose: () => void
  event: Event | null
}

type FormData = {
  first_name: string
  last_name: string
  email: string
  phone: string
  country: string
  city: string
  dni: string
  gender: string
  instagram: string
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

const INITIAL: FormData = {
  first_name: '', last_name: '', email: '', phone: '',
  country: '', city: '', dni: '', gender: '', instagram: '',
}

function InputField({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <label style={{
        fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px',
        letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: 'var(--gold)', marginLeft: '3px' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: focused
            ? '0.5px solid rgba(201,168,76,0.6)'
            : '0.5px solid rgba(201,168,76,0.2)',
          padding: '10px 0',
          color: 'var(--bone)',
          fontFamily: 'var(--font-inter)',
          fontWeight: 300,
          fontSize: '14px',
          outline: 'none',
          width: '100%',
          transition: 'border-color 200ms ease',
        }}
      />
    </div>
  )
}

function SelectField({
  label, value, onChange, options, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      <label style={{
        fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '10px',
        letterSpacing: '0.1em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: 'var(--gold)', marginLeft: '3px' }}>*</span>}
      </label>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: 'var(--bg-secondary)',
          border: 'none',
          borderBottom: focused
            ? '0.5px solid rgba(201,168,76,0.6)'
            : '0.5px solid rgba(201,168,76,0.2)',
          padding: '10px 0',
          color: value ? 'var(--bone)' : 'rgba(245,240,232,0.25)',
          fontFamily: 'var(--font-inter)',
          fontWeight: 300,
          fontSize: '14px',
          outline: 'none',
          width: '100%',
          transition: 'border-color 200ms ease',
          appearance: 'none',
          cursor: 'pointer',
        }}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#0F0F1A', color: 'var(--bone)' }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function RegistrationModal({ isOpen, onClose, event }: Props) {
  const { t, lang } = useI18n()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      setTimeout(() => {}, 10)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setTimeout(() => { setMounted(false); setStatus('idle'); setForm(INITIAL) }, 350)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const set = useCallback((field: keyof FormData) => (v: string) => {
    setForm((prev) => ({ ...prev, [field]: v }))
  }, [])

  const validate = (): string | null => {
    if (!form.first_name || !form.last_name || !form.email || !form.country || !form.dni || !form.gender)
      return t.errorRequired
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return t.errorEmail
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setErrorMsg(err); return }
    setErrorMsg('')
    setStatus('loading')

    try {
      // Check blacklist
      const blRes = await fetch('/api/check-blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, dni: form.dni }),
      })
      const blData = await blRes.json()
      if (blData.blocked) { setStatus('error'); setErrorMsg(t.errorBlocked); return }

      // Submit registration
      const ref_code = new URLSearchParams(window.location.search).get('ref') ?? undefined
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, event_id: event?.id, language: lang, ref_code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? t.errorGeneral)
        return
      }
      if (data.success === false) {
        setStatus('error')
        setErrorMsg(data.message ?? data.error ?? t.errorGeneral)
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg(t.errorGeneral)
    }
  }

  if (!mounted && !isOpen) return null

  const countryOptions = countries.map((c) => ({
    value: c.code,
    label: lang === 'es' ? c.name : c.nameEn,
  }))

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center z-[8000] px-4 py-6"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 350ms ease',
      }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="relative w-full overflow-y-auto"
        style={{
          maxWidth: '520px',
          maxHeight: '90vh',
          background: '#0F0F1A',
          border: '0.5px solid rgba(201,168,76,0.25)',
          borderRadius: '16px',
          padding: 'clamp(28px, 5vw, 40px) clamp(24px, 5vw, 48px)',
          transform: isOpen ? 'scale(1)' : 'scale(0.96)',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1), opacity 350ms ease',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: '18px', right: '18px', width: '28px', height: '28px',
            border: '0.5px solid rgba(201,168,76,0.35)',
            background: 'rgba(201,168,76,0.04)',
            color: 'var(--gold)',
            transition: 'background 200ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.1)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '26px', color: 'var(--bone)', lineHeight: 1.2 }}>
            {t.modalTitle}
          </h2>
          {event && (
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '11px', letterSpacing: '0.06em', color: 'rgba(201,168,76,0.6)', marginTop: '4px' }}>
              {event.name} · {event.city} · {event.country}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
            {t.modalSubtitle}
          </p>
        </div>

        {/* Success state */}
        {status === 'success' ? (
          <div className="flex flex-col items-center text-center py-8" style={{ gap: '16px' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L24.5 15.5L37 16L28 24.5L31 37L20 30.5L9 37L12 24.5L3 16L15.5 15.5L20 4Z" stroke="#C9A84C" strokeWidth="0.8" fill="rgba(201,168,76,0.08)"/>
            </svg>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: 'var(--bone)' }}>
              {t.successTitle}
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
              {t.successSubtitle}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: '20px' }}>
            {/* Row 1: Name */}
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t.firstName} value={form.first_name} onChange={set('first_name')} required />
              <InputField label={t.lastName} value={form.last_name} onChange={set('last_name')} required />
            </div>

            {/* Row 2: Email */}
            <InputField label={t.email} value={form.email} onChange={set('email')} type="email" required />

            {/* Row 3: Phone + Country */}
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t.phone} value={form.phone} onChange={set('phone')} type="tel" placeholder="+54 11..." />
              <SelectField
                label={t.country}
                value={form.country}
                onChange={set('country')}
                options={countryOptions}
                placeholder={t.selectCountry}
                required
              />
            </div>

            {/* Row 4: City */}
            <InputField label={t.city} value={form.city} onChange={set('city')} />

            {/* Row 5: DNI + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t.dni} value={form.dni} onChange={set('dni')} required />
              <SelectField
                label={t.gender}
                value={form.gender}
                onChange={set('gender')}
                options={t.genderOptions}
                placeholder={t.selectGender}
                required
              />
            </div>

            {/* Row 6: Instagram */}
            <InputField
              label={t.instagram}
              value={form.instagram}
              onChange={set('instagram')}
              placeholder={t.instagramPlaceholder}
            />

            {/* Error */}
            {(status === 'error' || errorMsg) && (
              <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '12px', color: '#e57373' }}>
                {errorMsg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '16px',
                marginTop: '4px',
                background: 'rgba(201,168,76,0.08)',
                border: '0.5px solid rgba(201,168,76,0.35)',
                borderRadius: '4px',
                color: 'var(--gold)',
                fontFamily: 'var(--font-inter)',
                fontWeight: 500,
                fontSize: '11px',
                letterSpacing: '0.15em',
                opacity: status === 'loading' ? 0.6 : 1,
                transition: 'background 200ms, opacity 200ms',
                animation: status === 'loading' ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
              }}
              onMouseEnter={(e) => { if (status !== 'loading') (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.18)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)' }}
            >
              {status === 'loading' ? t.submitting : t.submitLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

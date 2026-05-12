'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Session } from '@supabase/supabase-js'
import { InvitationsTab } from './AccountContent'

const S = { fontFamily: 'var(--font-inter)', fontWeight: 300 } as const
const GOLD = '#C9A84C'

// ── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '36px', height: '36px', border: '0.5px solid rgba(201,168,76,0.2)', borderTop: `0.5px solid ${GOLD}`, borderRadius: '50%', animation: 'cuentaSpin 1s linear infinite' }} />
      <style>{`@keyframes cuentaSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Password strength bar ─────────────────────────────────────────────────────

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strength = checks.filter(Boolean).length
  const colors = ['', '#ef5350', '#ff9800', '#ffca28', '#66bb6a']

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: '2px', borderRadius: '2px', background: i < strength ? colors[strength] : 'rgba(245,240,232,0.1)', transition: 'background 200ms' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {[
          { label: 'Al menos 8 caracteres', ok: checks[0] },
          { label: 'Una mayúscula', ok: checks[1] },
          { label: 'Un número', ok: checks[2] },
          { label: 'Un carácter especial', ok: checks[3] },
        ].map(({ label, ok }) => (
          <p key={label} style={{ ...S, fontSize: '11px', color: ok ? 'rgba(102,187,106,0.8)' : 'rgba(245,240,232,0.35)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', textAlign: 'center' }}>{ok ? '✓' : '·'}</span>{label}
          </p>
        ))}
      </div>
    </div>
  )
}

// ── Eye toggle SVG ────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {open
        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
      }
    </svg>
  )
}

// ── Auth Panel — no session ───────────────────────────────────────────────────

function LoginSection({ onSuccess, emailPrefill }: { onSuccess: () => void; emailPrefill?: string }) {
  const [view, setView] = useState<'normal' | 'reset'>('normal')
  const [email, setEmail] = useState(emailPrefill ?? '')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')

  useEffect(() => {
    if (emailPrefill) setEmail(emailPrefill)
  }, [emailPrefill])

  async function handleLogin() {
    if (!email || !password) { setLoginError('Completá email y contraseña'); return }
    setLoginLoading(true)
    setLoginError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setLoginError('Email o contraseña incorrectos.')
      } else {
        onSuccess()
      }
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleReset() {
    if (!resetEmail || !resetEmail.includes('@')) { setResetError('Ingresá un email válido'); return }
    setResetLoading(true)
    setResetError('')
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail }) })
      if (res.ok) { setResetSent(true) } else { setResetError('No pudimos enviar el email. Intentá de nuevo.') }
    } finally {
      setResetLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.25)', borderRadius: '8px', color: '#F5F0E8', caretColor: GOLD, ...S, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase' as const, display: 'block', marginBottom: '4px' }

  if (view === 'reset') {
    return (
      <div>
        <button onClick={() => setView('normal')} style={{ ...S, fontSize: '12px', color: 'rgba(201,168,76,0.6)', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
          ← Volver al login
        </button>
        <h3 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: '22px', color: '#F5F0E8', marginBottom: '8px' }}>RECUPERAR CONTRASEÑA</h3>
        <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.5)', lineHeight: 1.5, marginBottom: '20px' }}>
          Ingresá tu email y te enviamos un link para crear una nueva contraseña.
        </p>
        {resetSent ? (
          <p style={{ ...S, fontSize: '13px', color: 'rgba(72,187,120,0.9)', lineHeight: 1.5 }}>
            Revisá tu email. Te enviamos un link de recuperación.
          </p>
        ) : (
          <>
            <label style={labelStyle}>EMAIL</label>
            <input type="email" placeholder="tu@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReset()} style={{ ...inputStyle, marginBottom: '12px' }} />
            {resetError && <p style={{ ...S, fontSize: '12px', color: 'rgba(229,115,115,0.9)', marginBottom: '10px' }}>{resetError}</p>}
            <button onClick={handleReset} disabled={resetLoading} style={{ width: '100%', padding: '13px', background: 'rgba(201,168,76,0.08)', border: `0.5px solid rgba(201,168,76,0.35)`, borderRadius: '8px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.14em', cursor: resetLoading ? 'wait' : 'pointer', opacity: resetLoading ? 0.6 : 1 }}>
              {resetLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={labelStyle}>EMAIL</label>
        <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoFocus={!emailPrefill} />
      </div>
      <div>
        <label style={labelStyle}>CONTRASEÑA</label>
        <div style={{ position: 'relative' }}>
          <input type={showPwd ? 'text' : 'password'} placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={{ ...inputStyle, paddingRight: '44px' }} autoFocus={!!emailPrefill} />
          <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.4)', display: 'flex', padding: '4px' }}>
            <EyeIcon open={showPwd} />
          </button>
        </div>
      </div>
      {loginError && <p style={{ ...S, fontSize: '12px', color: 'rgba(229,115,115,0.9)' }}>{loginError}</p>}
      <button onClick={handleLogin} disabled={loginLoading} style={{ width: '100%', padding: '13px', background: 'rgba(201,168,76,0.1)', border: `0.5px solid rgba(201,168,76,0.4)`, borderRadius: '8px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.14em', cursor: loginLoading ? 'wait' : 'pointer', opacity: loginLoading ? 0.6 : 1 }}>
        {loginLoading ? 'INGRESANDO...' : 'INGRESAR'}
      </button>
      <button onClick={() => setView('reset')} style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'right', padding: 0 }}>
        ¿Olvidaste tu contraseña?
      </button>
    </div>
  )
}

function SignupSection({ onSuccess, onSwitchToLogin }: { onSuccess: () => void; onSwitchToLogin: (email: string) => void }) {
  const [step, setStep] = useState<'email' | 'found' | 'notfound'>('email')
  const [emailInput, setEmailInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function checkEmail() {
    if (!emailInput.trim().includes('@')) { setError('Ingresá un email válido'); return }
    setChecking(true)
    setError('')
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(emailInput.trim())}`)
      const data = await res.json()
      if (data.exists) {
        setStep('found')
        setFirstName(data.firstName ?? '')
      } else {
        setStep('notfound')
      }
    } finally {
      setChecking(false)
    }
  }

  async function handleSignup() {
    if (!password) { setError('Ingresá una contraseña'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput.trim(), password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al crear la cuenta'); return }
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: emailInput.trim(), password })
      if (signInError) { setError(signInError.message); return }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.25)', borderRadius: '8px', color: '#F5F0E8', caretColor: GOLD, ...S, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase' as const, display: 'block', marginBottom: '4px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>EMAIL</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            placeholder="tu@email.com"
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setStep('email'); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && checkEmail()}
            style={{ ...inputStyle, flex: 1 }}
            autoFocus
          />
          <button
            onClick={checkEmail}
            disabled={checking}
            style={{ padding: '12px 16px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: '8px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.1em', cursor: checking ? 'wait' : 'pointer', opacity: checking ? 0.6 : 1, whiteSpace: 'nowrap' as const }}
          >
            {checking ? '...' : 'CONTINUAR'}
          </button>
        </div>
        {error && step === 'email' && <p style={{ ...S, fontSize: '12px', color: 'rgba(229,115,115,0.9)', marginTop: '6px' }}>{error}</p>}
      </div>

      {step === 'notfound' && (
        <div style={{ padding: '14px 16px', background: 'rgba(245,240,232,0.04)', border: '0.5px solid rgba(245,240,232,0.1)', borderRadius: '8px' }}>
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.6)', lineHeight: 1.5, marginBottom: '12px' }}>
            Para crear una cuenta primero registrate a un evento.
          </p>
          <Link href="/" style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', color: GOLD, textDecoration: 'none' }}>
            VER EVENTOS →
          </Link>
        </div>
      )}

      {step === 'found' && (
        <>
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.5 }}>
            {firstName ? `Hola, ${firstName}. ` : ''}Encontramos tu solicitud. Elegí tu contraseña.
          </p>
          <div>
            <label style={labelStyle}>CONTRASEÑA</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} placeholder="Mín. 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '44px' }} autoFocus />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.4)', display: 'flex', padding: '4px' }}>
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>
          {password && <StrengthBar password={password} />}
          <div>
            <label style={labelStyle}>CONFIRMAR CONTRASEÑA</label>
            <input type={showPwd ? 'text' : 'password'} placeholder="Repetí tu contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSignup()} style={inputStyle} />
          </div>
          {error && <p style={{ ...S, fontSize: '12px', color: 'rgba(229,115,115,0.9)' }}>{error}</p>}
          <button onClick={handleSignup} disabled={loading} style={{ width: '100%', padding: '13px', background: 'rgba(201,168,76,0.1)', border: `0.5px solid rgba(201,168,76,0.4)`, borderRadius: '8px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.14em', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
          </button>
          <button onClick={() => onSwitchToLogin(emailInput)} style={{ ...S, fontSize: '12px', color: 'rgba(245,240,232,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
            ¿Ya tenés cuenta? Ingresá
          </button>
        </>
      )}
    </div>
  )
}

function AuthPanel() {
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [loginEmailPrefill, setLoginEmailPrefill] = useState('')
  const handleSuccess = () => { /* session subscription fires automatically */ }

  function handleSwitchToLogin(email: string) {
    setLoginEmailPrefill(email)
    setTab('login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#0F0F1A', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: 'clamp(28px,5vw,44px)', position: 'relative' }}>

        <Link href="/" style={{ position: 'absolute', top: '20px', left: '20px', ...S, fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(201,168,76,0.4)', textDecoration: 'none' }}>
          ← ONLY MEMBERS
        </Link>

        <p style={{ ...S, fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center', marginTop: '8px' }}>
          ONLY MEMBERS
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
          {(['login', 'signup'] as const).map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                  background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  border: `0.5px solid ${active ? 'rgba(201,168,76,0.35)' : 'rgba(245,240,232,0.1)'}`,
                  color: active ? GOLD : 'rgba(245,240,232,0.4)',
                  ...S, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  transition: 'all 150ms ease',
                }}
              >
                {t === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
              </button>
            )
          })}
        </div>

        {tab === 'login'
          ? <LoginSection onSuccess={handleSuccess} emailPrefill={loginEmailPrefill} />
          : <SignupSection onSuccess={handleSuccess} onSwitchToLogin={handleSwitchToLogin} />
        }
      </div>
    </div>
  )
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ session, registration }: { session: Session; registration: any }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    phone: registration?.phone ?? '',
    country: registration?.country ?? '',
    city: registration?.city ?? '',
    instagram: registration?.instagram ?? '',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [pwdStep, setPwdStep] = useState<'idle' | 'confirm' | 'sent'>('idle')
  const [pwdLoading, setPwdLoading] = useState(false)

  async function handleSaveProfile() {
    setSaveLoading(true)
    setSaveSuccess(false)
    setSaveError('')
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setSaveSuccess(true); setEditing(false) }
      else { setSaveError('No pudimos guardar los cambios.') }
    } finally {
      setSaveLoading(false)
    }
  }

  async function handleSendResetLink() {
    setPwdLoading(true)
    const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: session.user.email }) })
    setPwdLoading(false)
    if (res.ok) setPwdStep('sent')
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'transparent', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: '6px', color: '#F5F0E8', caretColor: GOLD, ...S, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase' as const, display: 'block', marginBottom: '4px' }
  const valueStyle: React.CSSProperties = { ...S, fontSize: '14px', color: '#F5F0E8', padding: '10px 0', borderBottom: '0.5px solid rgba(201,168,76,0.1)' }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 clamp(16px,4vw,40px) 80px' }}>

      {/* Personal data */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ ...S, fontSize: '11px', letterSpacing: '0.16em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase' }}>DATOS PERSONALES</p>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ ...S, fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.5)', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
              EDITAR
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={labelStyle}>NOMBRE</span>
            <p style={valueStyle}>{registration?.first_name ?? ''} {registration?.last_name ?? ''}</p>
          </div>
          <div>
            <span style={labelStyle}>EMAIL</span>
            <p style={valueStyle}>{session.user.email}</p>
          </div>

          {editing ? (
            <>
              <div>
                <label style={labelStyle}>TELÉFONO</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+54 11..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PAÍS</label>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Argentina" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CIUDAD</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Buenos Aires" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>INSTAGRAM</label>
                <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" style={inputStyle} />
              </div>
              {saveError && <p style={{ ...S, fontSize: '12px', color: 'rgba(229,115,115,0.9)' }}>{saveError}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleSaveProfile} disabled={saveLoading} style={{ flex: 1, padding: '12px', background: 'rgba(201,168,76,0.1)', border: `0.5px solid rgba(201,168,76,0.4)`, borderRadius: '6px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.12em', cursor: saveLoading ? 'wait' : 'pointer', opacity: saveLoading ? 0.6 : 1 }}>
                  {saveLoading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '12px 16px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '6px', color: 'rgba(245,240,232,0.4)', ...S, fontSize: '11px', cursor: 'pointer' }}>
                  CANCELAR
                </button>
              </div>
            </>
          ) : (
            <>
              {[
                { label: 'TELÉFONO', value: form.phone },
                { label: 'PAÍS', value: form.country },
                { label: 'CIUDAD', value: form.city },
                { label: 'INSTAGRAM', value: form.instagram },
                { label: 'DNI', value: registration?.dni ? `****${String(registration.dni).slice(-4)}` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span style={labelStyle}>{label}</span>
                  <p style={valueStyle}>{value || '—'}</p>
                </div>
              ))}
            </>
          )}

          {saveSuccess && !editing && (
            <p style={{ ...S, fontSize: '12px', color: 'rgba(72,187,120,0.9)' }}>Perfil actualizado correctamente.</p>
          )}
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: '0.5px', background: 'rgba(201,168,76,0.15)', marginBottom: '28px' }} />

      {/* Security */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ ...S, fontSize: '11px', letterSpacing: '0.16em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: '20px' }}>SEGURIDAD</p>

        {pwdStep === 'idle' && (
          <button onClick={() => setPwdStep('confirm')} style={{ ...S, fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(245,240,232,0.6)', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '6px', padding: '12px 16px', cursor: 'pointer' }}>
            CAMBIAR CONTRASEÑA
          </button>
        )}

        {pwdStep === 'confirm' && (
          <div style={{ padding: '16px', background: 'rgba(201,168,76,0.04)', border: '0.5px solid rgba(201,168,76,0.15)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.7)', lineHeight: 1.6, margin: 0 }}>
              Para cambiar tu contraseña, confirmaremos tu identidad enviando un link a:
            </p>
            <p style={{ ...S, fontSize: '13px', color: '#F5F0E8', margin: 0 }}>{session.user.email}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSendResetLink}
                disabled={pwdLoading}
                style={{ flex: 1, padding: '12px', background: 'rgba(201,168,76,0.1)', border: `0.5px solid rgba(201,168,76,0.4)`, borderRadius: '6px', color: GOLD, ...S, fontSize: '11px', letterSpacing: '0.12em', cursor: pwdLoading ? 'wait' : 'pointer', opacity: pwdLoading ? 0.6 : 1 }}
              >
                {pwdLoading ? 'ENVIANDO...' : 'ENVIAR CONFIRMACIÓN AL EMAIL'}
              </button>
              <button onClick={() => setPwdStep('idle')} style={{ padding: '12px 14px', background: 'transparent', border: '0.5px solid rgba(245,240,232,0.15)', borderRadius: '6px', color: 'rgba(245,240,232,0.4)', ...S, fontSize: '11px', cursor: 'pointer' }}>
                CANCELAR
              </button>
            </div>
          </div>
        )}

        {pwdStep === 'sent' && (
          <p style={{ ...S, fontSize: '13px', color: 'rgba(72,187,120,0.9)', lineHeight: 1.5 }}>
            Revisá tu email. Te enviamos un link para cambiar tu contraseña.
          </p>
        )}
      </div>

      {/* Separator */}
      <div style={{ height: '0.5px', background: 'rgba(201,168,76,0.1)', marginBottom: '24px' }} />

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{ width: '100%', padding: '13px', background: 'transparent', border: '0.5px solid rgba(229,115,115,0.3)', borderRadius: '8px', color: 'rgba(229,115,115,0.7)', ...S, fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer', transition: 'all 150ms ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(229,115,115,0.06)'; e.currentTarget.style.borderColor = 'rgba(229,115,115,0.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(229,115,115,0.3)' }}
      >
        CERRAR SESIÓN
      </button>
    </div>
  )
}

// ── Account Dashboard — with session ─────────────────────────────────────────

function AccountDashboard({ session }: { session: Session }) {
  const [data, setData] = useState<{ registrations: any[]; payments: any[] } | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [tab, setTab] = useState<'invitations' | 'profile'>('invitations')

  useEffect(() => {
    fetch('/api/cuenta/data')
      .then((r) => r.json())
      .then((d) => { setData(d); setDataLoading(false) })
      .catch(() => setDataLoading(false))
  }, [session.user.email])

  const firstName = data?.registrations?.[0]?.first_name ?? session.user.user_metadata?.first_name ?? ''

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F5F0E8' }}>
      {/* Header */}
      <div style={{ padding: '24px clamp(20px,5vw,48px) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ ...S, fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(201,168,76,0.6)', textDecoration: 'none' }}>
          ← ONLY MEMBERS
        </Link>
      </div>

      {/* Greeting */}
      <div style={{ textAlign: 'center', padding: 'clamp(32px,6vw,64px) 24px clamp(16px,3vw,32px)' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300, fontSize: 'clamp(28px,5vw,44px)', color: '#F5F0E8' }}>
          Hola, {firstName}.
        </h1>
        <div style={{ width: '60px', height: '0.5px', background: 'rgba(201,168,76,0.5)', margin: '14px auto 0' }} />
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '0 24px 32px' }}>
        {(['invitations', 'profile'] as const).map((t) => {
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '9px 20px', borderRadius: '20px', cursor: 'pointer',
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                border: `0.5px solid ${active ? 'rgba(201,168,76,0.4)' : 'rgba(245,240,232,0.15)'}`,
                color: active ? GOLD : 'rgba(245,240,232,0.4)',
                ...S, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase',
                transition: 'all 150ms ease',
              }}
            >
              {t === 'invitations' ? 'MIS INVITACIONES' : 'MI PERFIL'}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'invitations' ? (
        dataLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '28px', height: '28px', border: '0.5px solid rgba(201,168,76,0.2)', borderTop: `0.5px solid ${GOLD}`, borderRadius: '50%', animation: 'cuentaSpin 1s linear infinite' }} />
          </div>
        ) : data ? (
          <InvitationsTab registrations={data.registrations} payments={data.payments} />
        ) : (
          <p style={{ ...S, fontSize: '13px', color: 'rgba(245,240,232,0.4)', textAlign: 'center', padding: '40px' }}>Error cargando datos.</p>
        )
      ) : (
        <ProfileTab
          session={session}
          registration={data?.registrations?.[0] ?? null}
        />
      )}
      <style>{`@keyframes cuentaSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CuentaPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Spinner />
  if (!session) return <AuthPanel />
  return <AccountDashboard session={session} />
}

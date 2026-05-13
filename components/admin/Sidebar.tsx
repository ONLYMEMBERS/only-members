'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

const NAV = [
  { href: '/admin/dashboard',     label: 'Dashboard',      icon: 'M3 3h7v7H3zM13 3h7v7h-7zM3 13h7v7H3zM13 13h7v7h-7z' },
  { href: '/admin/events',        label: 'Eventos',        icon: 'M8 2v3M16 2v3M3 9h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z' },
  { href: '/admin/registrations', label: 'Registros',      icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { href: '/admin/invitations',   label: 'Invitaciones',   icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
  { href: '/admin/confirmed',     label: 'Confirmados',    icon: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
  { href: '/admin/members',       label: 'Members',        icon: 'M12 2l2.09 6.26H21l-5.47 3.97 2.09 6.26L12 14.51l-5.62 3.98 2.09-6.26L3 8.26h6.91z' },
  { href: '/admin/sales',         label: 'Ventas',         icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6' },
  { href: '/admin/referrals',     label: 'Referidos',      icon: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71' },
  { href: '/admin/csv',           label: 'Upload CSV',     icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12' },
  { href: '/admin/logs',          label: 'Emails / Logs',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4' },
  { href: '/admin/archive',       label: 'Archivo',        icon: 'M21 8v13H3V8M23 3H1v5h22zM10 12h4' },
  { href: '/admin/blacklist',     label: 'Blacklist',      icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM4.93 4.93l14.14 14.14' },
  { href: '/admin/support',       label: 'Soporte',        icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { href: '/admin/door',          label: 'Puerta',         icon: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7M12 12v6M9 15l3-3 3 3' },
  { href: '/admin/settings',      label: 'Configuración',  icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
  { href: '/admin/system',        label: 'Sistema',        icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
]

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin')
  }

  const content = (
    <div
      style={{
        width: '240px',
        height: '100vh',
        background: '#0A0A0F',
        borderRight: '0.5px solid rgba(201,168,76,0.12)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '0.5px solid rgba(201,168,76,0.08)' }}>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 500, fontSize: '13px', letterSpacing: '0.22em', color: '#F5F0E8', marginBottom: '2px' }}>
          ONLY MEMBERS
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontWeight: 300, fontSize: '9px', letterSpacing: '0.18em', color: '#C9A84C' }}>
          ADMIN
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 24px',
                borderLeft: active ? '2px solid #C9A84C' : '2px solid transparent',
                color: active ? '#C9A84C' : 'rgba(245,240,232,0.45)',
                background: active ? 'rgba(201,168,76,0.05)' : 'transparent',
                fontFamily: 'var(--font-inter)',
                fontWeight: 300,
                fontSize: '11px',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)' }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <NavIcon d={icon} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 24px 24px', borderTop: '0.5px solid rgba(201,168,76,0.08)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-inter)',
            fontWeight: 300,
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'rgba(245,240,232,0.35)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textTransform: 'uppercase',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 right-4 z-50 md:hidden"
        style={{
          width: '44px', height: '44px',
          background: 'rgba(10,10,15,0.9)',
          border: '0.5px solid rgba(201,168,76,0.2)',
          borderRadius: '4px',
          color: '#C9A84C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          {mobileOpen
            ? <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            : <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
          }
        </svg>
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:block">{content}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-[99]"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setMobileOpen(false)}
          />
          {content}
        </div>
      )}
    </>
  )
}

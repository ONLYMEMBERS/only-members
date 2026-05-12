'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function UserFloatingButton() {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <button
      onClick={() => router.push('/cuenta')}
      aria-label="Mi cuenta"
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '32px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '0.5px solid rgba(201,168,76,0.5)',
        background: 'rgba(10,10,15,0.92)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        backdropFilter: 'blur(8px)',
        transition: 'all 200ms ease',
        boxShadow: '0 0 20px rgba(201,168,76,0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(201,168,76,0.12)'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(10,10,15,0.92)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </button>
  )
}

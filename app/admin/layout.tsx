'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/admin'

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0F' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          minHeight: '100vh',
          overflow: 'auto',
        }}
        className="md:ml-60"
      >
        {children}
      </main>
    </div>
  )
}

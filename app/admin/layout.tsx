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
      {/* FIX 9: ml-0 on mobile, ml-[240px] on md+ */}
      <main
        style={{ flex: 1, minHeight: '100vh', overflow: 'auto' }}
        className="ml-0 md:ml-[240px]"
      >
        {children}
      </main>
    </div>
  )
}

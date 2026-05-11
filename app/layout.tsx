import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/components/ui/AppProviders'
import { AuthProvider } from '@/lib/auth-context'
import { AuthModalProvider } from '@/lib/auth-modal-context'
import UserFloatingButton from '@/components/ui/UserFloatingButton'
import AuthHandler from '@/components/ui/AuthHandler'
import AuthLoginModal from '@/components/ui/AuthLoginModal'
import { CookieBanner } from '@/components/ui/CookieBanner'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://onlymembers.life'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Only Members — Resilio',
  description: 'Experiencias privadas para personas extraordinarias.',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: siteUrl,
    siteName: 'Only Members',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="antialiased">
        <AppProviders>
          <AuthProvider>
            <AuthModalProvider>
              <AuthHandler />
              {children}
              <UserFloatingButton />
              <CookieBanner />
              <AuthLoginModal />
            </AuthModalProvider>
          </AuthProvider>
        </AppProviders>
      </body>
    </html>
  )
}

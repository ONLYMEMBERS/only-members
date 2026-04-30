import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/components/ui/AppProviders'
import UserFloatingButton from '@/components/ui/UserFloatingButton'
import { AuthErrorHandler } from '@/components/ui/AuthErrorHandler'
import AuthHandler from '@/components/ui/AuthHandler'

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
          <AuthHandler />
          {children}
          <UserFloatingButton />
          <AuthErrorHandler />
        </AppProviders>
      </body>
    </html>
  )
}

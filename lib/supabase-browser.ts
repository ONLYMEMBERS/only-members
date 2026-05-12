import { createBrowserClient } from '@supabase/ssr'

// CONFIGURAR EN SUPABASE DASHBOARD:
// 1. Authentication → Providers → Email
//    - Enable Email provider: ON
//    - Confirm email: OFF (usuarios pueden loguar sin confirmar)
//    - Secure email change: ON
//
// 2. Authentication → URL Configuration
//    - Site URL: https://onlymembers.life
//    - Redirect URLs:
//      https://onlymembers.life/cuenta/nueva-contrasena
//      https://onlymembers.life/cuenta/crear-contrasena
//      https://onlymembers.life/cuenta
//      https://onlymembers.life/**
//
// 3. Authentication → Email Templates → Reset Password
//    Cambiar el link del botón a:
//    {{ .SiteURL }}/cuenta/nueva-contrasena
//
// 4. Authentication → Email Templates → Invite User
//    Cambiar el link del botón a:
//    {{ .SiteURL }}/cuenta/crear-contrasena

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        storageKey: 'om-session',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  )
}

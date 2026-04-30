// SUPABASE DASHBOARD REQUIRED CONFIG (Authentication > URL Configuration):
// - Site URL: https://onlymembers.life  (no www, no trailing slash)
// - Redirect URLs: https://onlymembers.life/cuenta, https://onlymembers.life/**
// - OTP Expiry (Authentication > Email): 86400 (24 hours)
import { createClient } from '@supabase/supabase-js'
import { DbEvent, City, mapDbEvent, Event } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

function isConfigured() {
  return !!supabaseUrl && !!supabaseAnonKey
}

export async function fetchCities(): Promise<City[] | null> {
  if (!isConfigured()) return null
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('active', true)
    .order('name')
  if (error) { console.error('fetchCities:', error.message); return null }
  return (data ?? []) as City[]
}

export async function fetchAllEvents(): Promise<Event[] | null> {
  if (!isConfigured()) {
    console.log('fetchAllEvents: Supabase not configured, using placeholder')
    return null
  }
  const supabase = createPublicClient()

  // Fetch active/soon events (FIX 1: ordered ASC for upcoming events)
  const { data: activeData, error: activeError } = await supabase
    .from('events')
    .select('*, cities(name, country, slug), speakers(id, name, role, bio, photo, link, visible, order_index), partners(id, name, logo, link, order_index)')
    .in('status', ['active', 'soon'])
    .order('date_start', { ascending: true })

  if (activeError) {
    console.error('fetchAllEvents (active):', activeError.message)
    return null
  }

  // Fetch past events (closed/archived) ordered DESC, limit 6 per city handled client-side
  const { data: pastData, error: pastError } = await supabase
    .from('events')
    .select('*, cities(name, country, slug), speakers(id, name, role, bio, photo, link, visible, order_index), partners(id, name, logo, link, order_index)')
    .in('status', ['closed', 'archived'])
    .order('date_start', { ascending: false })

  if (pastError) {
    console.error('fetchAllEvents (past):', pastError.message)
    // Don't fail entirely — just return active events
  }

  const combined = [...(activeData ?? []), ...(pastData ?? [])]
  console.log(`fetchAllEvents: ${activeData?.length ?? 0} active, ${pastData?.length ?? 0} past`)

  return combined.map((e) => mapDbEvent(e as DbEvent))
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  if (!isConfigured()) return null
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, cities(name, country, slug), speakers(id, name, role, bio, photo, link, visible, order_index), partners(id, name, logo, link, order_index)')
    .eq('slug', slug)
    .neq('status', 'draft')
    .single()
  if (error) { console.error('fetchEventBySlug:', error.message); return null }
  return mapDbEvent(data as DbEvent)
}

export async function fetchEventSlugs(): Promise<string[]> {
  if (!isConfigured()) return []
  const supabase = createPublicClient()
  const { data } = await supabase.from('events').select('slug').neq('status', 'draft')
  return (data ?? []).map((e: { slug: string }) => e.slug)
}

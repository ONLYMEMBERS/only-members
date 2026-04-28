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
  return data as City[]
}

export async function fetchAllEvents(): Promise<Event[] | null> {
  if (!isConfigured()) return null
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('events')
    .select(`*, cities(name, country, slug), speakers(id, name, role, bio, photo, link, visible, order_index), partners(id, name, logo, link, order_index)`)
    .neq('status', 'draft')
    .order('date_start', { ascending: false })
  if (error) { console.error('fetchAllEvents:', error.message); return null }
  return (data as DbEvent[]).map(mapDbEvent)
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  if (!isConfigured()) return null
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('events')
    .select(`*, cities(name, country, slug), speakers(id, name, role, bio, photo, link, visible, order_index), partners(id, name, logo, link, order_index)`)
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

export type EventStatus = 'draft' | 'soon' | 'active' | 'closed' | 'archived'

export type City = {
  id: string
  name: string
  country: string
  slug: string
  active: boolean
}

export type Speaker = {
  id: string
  name: string
  role: string | null
  bio: string | null
  photo: string | null
  link: string | null
  order_index: number
}

export type Partner = {
  id: string
  name: string
  logo: string | null
  link: string | null
  order_index: number
}

export type Event = {
  id: string
  slug: string
  name: string
  subtitle: string
  subtitle_en?: string | null
  city: string
  country: string
  date: string
  date_start?: string | null
  date_end?: string | null
  timezone?: string
  status: EventStatus
  secret_location: boolean
  location_name?: string | null
  location_address?: string | null
  progress_value: number
  cover_image: string
  hero_image: string
  description_es: string
  description_en: string
  tagline?: string | null
  dress_code?: string | null
  dress_code_images?: string[] | null
  price?: number | null
  currency?: string
  purchase_link?: string | null
  capacity?: number | null
  og_title?: string | null
  og_description?: string | null
  speakers?: Speaker[]
  partners?: Partner[]
}

export type DbEvent = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  subtitle_en: string | null
  country: string
  date_start: string | null
  date_end: string | null
  timezone: string
  status: EventStatus
  secret_location: boolean
  location_name: string | null
  location_address: string | null
  location_lat: number | null
  location_lng: number | null
  progress_value: number
  cover_image: string | null
  hero_image: string | null
  description_es: string | null
  description_en: string | null
  tagline: string | null
  dress_code: string | null
  dress_code_images: string[] | null
  price: number | null
  currency: string
  purchase_link: string | null
  purchase_link_expires_at: string | null
  capacity: number | null
  og_title: string | null
  og_description: string | null
  cities: { name: string; country: string; slug: string } | null
  speakers?: Speaker[]
  partners?: Partner[]
}

export function formatEventDate(dateStart: string | null, timezone?: string): string {
  if (!dateStart) return 'PRÓXIMAMENTE'
  const date = new Date(dateStart)
  return date
    .toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: timezone || 'UTC',
    })
    .toUpperCase()
    .replace('.', '')
}

export function mapDbEvent(db: DbEvent): Event {
  return {
    id: db.id,
    slug: db.slug,
    name: db.name,
    subtitle: db.subtitle ?? '',
    subtitle_en: db.subtitle_en,
    city: db.cities?.name ?? '',
    country: db.cities?.country ?? db.country,
    date: formatEventDate(db.date_start, db.timezone),
    date_start: db.date_start,
    date_end: db.date_end,
    timezone: db.timezone,
    status: db.status,
    secret_location: db.secret_location,
    location_name: db.location_name,
    location_address: db.location_address,
    progress_value: db.progress_value,
    cover_image: db.cover_image ?? '',
    hero_image: db.hero_image ?? '',
    description_es: db.description_es ?? '',
    description_en: db.description_en ?? '',
    tagline: db.tagline,
    dress_code: db.dress_code,
    dress_code_images: db.dress_code_images,
    price: db.price,
    currency: db.currency,
    purchase_link: db.purchase_link,
    capacity: db.capacity,
    og_title: db.og_title,
    og_description: db.og_description,
    speakers: db.speakers,
    partners: db.partners,
  }
}

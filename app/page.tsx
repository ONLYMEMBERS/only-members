import { AdminFloatingButton } from '@/components/ui/AdminFloatingButton'
import { LandingClient } from '@/components/landing/LandingClient'
import { fetchCities, fetchAllEvents } from '@/lib/supabase'
import { placeholderCities, events as placeholderEvents } from '@/lib/placeholder-data'

// FIX 5: revalidar cada 60s para que nuevos eventos aparezcan sin rebuild
export const revalidate = 60

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr))
}

export default async function HomePage() {
  const [cities, allEvents] = await Promise.all([
    fetchCities().catch(() => null),
    fetchAllEvents().catch(() => null),
  ])

  // FIX 4: si Supabase devuelve al menos 1 evento → usar SOLO datos reales
  //        si devuelve null (error/sin config) o array vacío → placeholder
  const hasRealEvents = Array.isArray(allEvents) && allEvents.length > 0
  const events = hasRealEvents ? allEvents! : placeholderEvents

  // FIX 2: selector muestra ciudades con eventos active/soon; si ninguna, todas las con eventos
  let cityNames: string[]
  if (hasRealEvents) {
    const withActive = unique(
      allEvents!
        .filter((e) => e.status === 'active' || e.status === 'soon')
        .map((e) => e.city)
        .filter(Boolean)
    )
    if (withActive.length > 0) {
      cityNames = withActive
    } else {
      const withAny = unique(allEvents!.map((e) => e.city).filter(Boolean))
      cityNames = withAny.length > 0 ? withAny : (cities?.map((c) => c.name) ?? placeholderCities)
    }
  } else {
    cityNames = cities?.map((c) => c.name) ?? placeholderCities
  }

  return (
    <>
      <LandingClient cities={cityNames} allEvents={events} />
      <AdminFloatingButton />
    </>
  )
}

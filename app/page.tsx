import { AdminFloatingButton } from '@/components/ui/AdminFloatingButton'
import { LandingClient } from '@/components/landing/LandingClient'
import { fetchCities, fetchAllEvents } from '@/lib/supabase'
import { placeholderCities, events as placeholderEvents } from '@/lib/placeholder-data'

export default async function HomePage() {
  const [cities, allEvents] = await Promise.all([
    fetchCities().catch(() => null),
    fetchAllEvents().catch(() => null),
  ])

  const cityNames = cities?.map((c) => c.name) ?? placeholderCities
  const events = allEvents ?? placeholderEvents

  return (
    <>
      <LandingClient cities={cityNames} allEvents={events} />
      <AdminFloatingButton />
    </>
  )
}

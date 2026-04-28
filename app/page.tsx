import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { EventsSection } from '@/components/landing/EventsSection'
import { ManifestoSection } from '@/components/landing/ManifestoSection'
import { AdminFloatingButton } from '@/components/ui/AdminFloatingButton'
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
      <Header cities={cityNames} />
      <main>
        <HeroSection allEvents={events} />
        <EventsSection allEvents={events} />
        <ManifestoSection />
      </main>
      <Footer />
      <AdminFloatingButton />
    </>
  )
}

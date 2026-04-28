'use client'

import { Event } from '@/lib/types'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from './HeroSection'
import { EventsSection } from './EventsSection'
import { ManifestoSection } from './ManifestoSection'

type Props = {
  cities: string[]
  allEvents: Event[]
}

export function LandingClient({ cities, allEvents }: Props) {
  return (
    <>
      <Header cities={cities} />
      <main>
        <HeroSection allEvents={allEvents} />
        <EventsSection allEvents={allEvents} />
        <ManifestoSection />
      </main>
      <Footer />
    </>
  )
}

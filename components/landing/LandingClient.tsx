'use client'

import { Event } from '@/lib/types'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from './HeroSection'
import { EventsSection } from './EventsSection'
import { ManifestoSection } from './ManifestoSection'
import { CitySelector } from './CitySelector'

type Props = {
  cities: string[]
  allEvents: Event[]
}

export function LandingClient({ cities, allEvents }: Props) {
  return (
    <>
      <Header />
      <CitySelector cities={cities} />
      <main>
        <HeroSection allEvents={allEvents} />
        <EventsSection allEvents={allEvents} />
        <ManifestoSection />
      </main>
      <Footer />
    </>
  )
}

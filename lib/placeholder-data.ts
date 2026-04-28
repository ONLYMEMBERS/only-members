// Re-export unified types for backward compatibility
export type { Event, EventStatus } from './types'

import type { Event } from './types'

export const events: Event[] = [
  {
    id: '1',
    slug: 'buenos-aires-primavera-2024',
    name: 'Noche de los Elegidos',
    subtitle: 'Una velada irrepetible en el corazón de Palermo',
    city: 'Buenos Aires',
    country: 'Argentina',
    date: '14 JUN 2025',
    date_start: '2025-06-14T21:00:00-03:00',
    status: 'active',
    secret_location: true,
    progress_value: 68,
    cover_image: '',
    hero_image: '',
    description_es: 'Una experiencia diseñada para quienes entienden que el lujo verdadero es la exclusividad. Una noche irrepetible en un espacio que solo existe por una noche.',
    description_en: 'An experience designed for those who understand that true luxury is exclusivity. An unrepeatable night in a space that only exists for one evening.',
    dress_code: 'All black con detalles dorados',
    tagline: 'Una sola noche. Una sola oportunidad.',
  },
  {
    id: '2',
    slug: 'buenos-aires-invierno-2024',
    name: 'Solsticio Sur',
    subtitle: 'Donde el invierno porteño cobró otro significado',
    city: 'Buenos Aires',
    country: 'Argentina',
    date: '21 JUN 2024',
    date_start: '2024-06-21T20:00:00-03:00',
    status: 'archived',
    secret_location: false,
    progress_value: 100,
    cover_image: '',
    hero_image: '',
    description_es: 'La primera edición que marcó el inicio de un circuito sin precedentes en Buenos Aires.',
    description_en: 'The first edition that marked the beginning of an unprecedented circuit in Buenos Aires.',
  },
  {
    id: '3',
    slug: 'madrid-otono-2024',
    name: 'Círculo Nocturno',
    subtitle: 'El Madrid que nunca se muestra',
    city: 'Madrid',
    country: 'España',
    date: '19 JUL 2025',
    date_start: '2025-07-19T22:00:00+02:00',
    status: 'soon',
    secret_location: true,
    progress_value: 31,
    cover_image: '',
    hero_image: '',
    description_es: 'Una noche en los rincones más reservados de la capital española. Acceso únicamente por invitación y solicitud aprobada.',
    description_en: 'A night in the most reserved corners of the Spanish capital. Access by invitation and approved request only.',
    dress_code: 'Elegancia oscura',
    tagline: 'Madrid nunca fue tan privado.',
  },
  {
    id: '4',
    slug: 'madrid-verano-2023',
    name: 'Verano Oculto',
    subtitle: 'El calor de Madrid bajo otra luz',
    city: 'Madrid',
    country: 'España',
    date: '08 AGO 2023',
    date_start: '2023-08-08T21:00:00+02:00',
    status: 'archived',
    secret_location: false,
    progress_value: 100,
    cover_image: '',
    hero_image: '',
    description_es: 'La edición que consolidó a Madrid como sede permanente del circuito.',
    description_en: 'The edition that consolidated Madrid as a permanent venue of the circuit.',
  },
]

export const placeholderCities = ['Buenos Aires', 'Madrid']

export function getEventsByCity(city: string): { active: Event[]; past: Event[] } {
  const cityEvents = events.filter((e) => e.city === city)
  return {
    active: cityEvents.filter((e) => e.status !== 'archived'),
    past: cityEvents.filter((e) => e.status === 'archived'),
  }
}

export function groupEventsByCity(allEvents: Event[]): Record<string, { active: Event[]; past: Event[] }> {
  const map: Record<string, { active: Event[]; past: Event[] }> = {}
  for (const event of allEvents) {
    if (!map[event.city]) map[event.city] = { active: [], past: [] }
    if (event.status === 'archived') map[event.city].past.push(event)
    else map[event.city].active.push(event)
  }
  return map
}

'use client'

import { createContext, useContext } from 'react'

export type Lang = 'es' | 'en'

export const strings = {
  es: {
    heroLabel: 'RESILIO PRESENTA',
    heroTitle: 'ONLY MEMBERS',
    heroSubtitle: 'Experiencias privadas para mentes extraordinarias',
    heroCta: 'DESCUBRIR',
    eventsTitle: 'EDICIONES ANTERIORES',
    requestAccess: 'SOLICITAR ACCESO',
    secretLocation: 'UBICACIÓN POR REVELAR',
    dateLabel: 'FECHA',
    statusActive: 'ACTIVO',
    statusSoon: 'PRÓXIMAMENTE',
    statusClosed: 'CERRADO',
    statusArchived: 'FINALIZADO',
    manifesto: [
      'Only Members es un circuito itinerante de eventos privados que redefine dónde, cómo y con quién se vive cada experiencia.',
      'Donde el acceso vale más que la entrada.',
      'Creamos encuentros que aparecen donde menos se esperan y dejan huella donde más importa.',
    ],
    // Modal de registro
    modalTitle: 'Solicitar Acceso',
    modalSubtitle: 'Completa tu perfil para unirte a la lista de considerados.',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    country: 'País',
    city: 'Ciudad',
    dni: 'DNI / Identificación',
    gender: 'Género',
    instagram: 'Instagram',
    instagramPlaceholder: '@usuario o link completo',
    submitLabel: 'SOLICITAR ACCESO',
    submitting: 'ENVIANDO...',
    successTitle: 'Tu solicitud fue recibida.',
    successSubtitle: 'Nos pondremos en contacto contigo si eres seleccionado/a.',
    errorGeneral: 'Ocurrió un error. Por favor intentá de nuevo.',
    errorBlocked: 'No podemos procesar tu solicitud en este momento.',
    errorRequired: 'Por favor completá todos los campos requeridos.',
    errorEmail: 'Ingresá un correo electrónico válido.',
    genderOptions: [
      { value: 'male', label: 'Masculino' },
      { value: 'female', label: 'Femenino' },
      { value: 'non_binary', label: 'No binario' },
      { value: 'prefer_not', label: 'Prefiero no decir' },
    ],
    selectCountry: 'Seleccionar país',
    selectGender: 'Seleccionar',
    // Evento
    dressCode: 'DRESS CODE',
    speakers: 'SPEAKERS',
    partners: 'PARTNERS',
    preRegister: 'PRE-REGISTRARME',
    preRegistering: 'ENVIANDO...',
    preRegisterSuccess: 'Registrado. Te avisaremos cuando abran las inscripciones.',
    preRegisterSubtitle: 'Sé el primero en saber cuando abran las inscripciones.',
    countdown: { days: 'DÍAS', hours: 'HORAS', minutes: 'MIN', seconds: 'SEG' },
    // RSVP
    rsvpConfirmedTitle: 'Confirmado.',
    rsvpConfirmedSubtitle: 'Tu asistencia ha sido registrada. Nos vemos pronto.',
    rsvpDeclinedTitle: 'Lamentamos que no puedas estar.',
    rsvpDeclinedSubtitle: 'Esperamos verte en la próxima edición.',
    // Generales
    namePlaceholder: 'Nombre completo',
    emailPlaceholder: 'Correo electrónico',
  },
  en: {
    heroLabel: 'RESILIO PRESENTS',
    heroTitle: 'ONLY MEMBERS',
    heroSubtitle: 'Private experiences for extraordinary minds',
    heroCta: 'DISCOVER',
    eventsTitle: 'PAST EDITIONS',
    requestAccess: 'REQUEST ACCESS',
    secretLocation: 'LOCATION TO BE REVEALED',
    dateLabel: 'DATE',
    statusActive: 'ACTIVE',
    statusSoon: 'COMING SOON',
    statusClosed: 'CLOSED',
    statusArchived: 'FINISHED',
    manifesto: [
      'Only Members is a travelling circuit of private events that redefines where, how and with whom each experience is lived.',
      'Where access is worth more than the ticket.',
      'We create gatherings that appear where least expected and leave a mark where it matters most.',
    ],
    modalTitle: 'Request Access',
    modalSubtitle: 'Complete your profile to join the consideration list.',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    country: 'Country',
    city: 'City',
    dni: 'ID / Passport',
    gender: 'Gender',
    instagram: 'Instagram',
    instagramPlaceholder: '@username or full link',
    submitLabel: 'REQUEST ACCESS',
    submitting: 'SENDING...',
    successTitle: 'Your request has been received.',
    successSubtitle: 'We will reach out if you are selected.',
    errorGeneral: 'An error occurred. Please try again.',
    errorBlocked: 'We cannot process your request at this time.',
    errorRequired: 'Please complete all required fields.',
    errorEmail: 'Please enter a valid email address.',
    genderOptions: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'non_binary', label: 'Non-binary' },
      { value: 'prefer_not', label: 'Prefer not to say' },
    ],
    selectCountry: 'Select country',
    selectGender: 'Select',
    dressCode: 'DRESS CODE',
    speakers: 'SPEAKERS',
    partners: 'PARTNERS',
    preRegister: 'PRE-REGISTER',
    preRegistering: 'SENDING...',
    preRegisterSuccess: 'Registered. We\'ll notify you when registrations open.',
    preRegisterSubtitle: 'Be the first to know when registrations open.',
    countdown: { days: 'DAYS', hours: 'HOURS', minutes: 'MIN', seconds: 'SEC' },
    rsvpConfirmedTitle: 'Confirmed.',
    rsvpConfirmedSubtitle: 'Your attendance has been registered. See you soon.',
    rsvpDeclinedTitle: 'Sorry you can\'t make it.',
    rsvpDeclinedSubtitle: 'We hope to see you at the next edition.',
    namePlaceholder: 'Full name',
    emailPlaceholder: 'Email address',
  },
}

export type Strings = typeof strings.es

export interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Strings
  city: string
  setCity: (city: string) => void
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: strings.es,
  city: 'Buenos Aires',
  setCity: () => {},
})

export const useI18n = () => useContext(I18nContext)

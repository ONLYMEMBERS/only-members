export type RegistrationStatus =
  | 'pending' | 'invited' | 'confirmed' | 'declined'
  | 'purchased' | 'waitlist' | 'imported' | 'vip'

export type Registration = {
  id: string
  event_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  country: string | null
  city: string | null
  dni: string | null
  gender: string | null
  instagram: string | null
  language: string
  status: RegistrationStatus
  ref_code: string | null
  rsvp_token: string
  is_vip: boolean
  tags: string[] | null
  internal_notes: string | null
  checkin_at: string | null
  created_at: string
  updated_at: string
  events?: { name: string } | null
}

export type EmailLog = {
  id: string
  registration_id: string | null
  type: string | null
  sent_at: string
  status: string
  resend_id: string | null
  opened_at: string | null
  clicked_at: string | null
  registrations?: { first_name: string; last_name: string; email: string; events?: { name: string } } | null
}

export type ReferralCode = {
  id: string
  event_id: string | null
  code: string
  name: string | null
  clicks: number
  registrations: number
  conversions: number
  created_at: string
  discount_type: 'percentage' | 'fixed' | null
  discount_value: number | null
  max_uses: number | null
  uses_count: number
  active: boolean
}

export type Payment = {
  id: string
  registration_id: string | null
  event_id: string | null
  payment_account_id: string | null
  mp_preference_id: string | null
  mp_payment_id: string | null
  amount: number
  currency: string
  discount_amount: number
  discount_code: string | null
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  fee_amount: number
  net_amount: number | null
  mp_status: string | null
  mp_status_detail: string | null
  paid_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export type PaymentAccount = {
  id: string
  name: string
  mp_access_token: string | null
  mp_public_key: string | null
  mp_user_id: string | null
  city_id: string | null
  fee_percentage: number | null
  is_main_account: boolean
  active: boolean
  created_at: string
}

export type SupportMessage = {
  id: string
  name: string
  email: string
  message: string
  event_related: string | null
  status: string
  created_at: string
}

export type AdminEvent = {
  id: string
  slug: string
  name: string
  status: string
  country: string
  date_start: string | null
  city_id: string | null
  cover_image: string | null
  cities?: { name: string; slug: string } | null
}

export const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  pending:   { bg: 'rgba(201,168,76,0.1)',  color: '#C9A84C',                border: 'rgba(201,168,76,0.3)'  },
  invited:   { bg: 'rgba(99,179,237,0.1)',  color: 'rgba(99,179,237,0.9)',   border: 'rgba(99,179,237,0.3)'  },
  confirmed: { bg: 'rgba(72,187,120,0.1)',  color: 'rgba(72,187,120,0.9)',   border: 'rgba(72,187,120,0.3)'  },
  declined:  { bg: 'rgba(252,129,74,0.1)',  color: 'rgba(252,129,74,0.9)',   border: 'rgba(252,129,74,0.3)'  },
  purchased: { bg: 'rgba(154,117,234,0.1)', color: 'rgba(154,117,234,0.9)',  border: 'rgba(154,117,234,0.3)' },
  waitlist:  { bg: 'rgba(113,128,150,0.1)', color: 'rgba(113,128,150,0.9)',  border: 'rgba(113,128,150,0.3)' },
  imported:  { bg: 'rgba(72,201,176,0.1)',  color: 'rgba(72,201,176,0.9)',   border: 'rgba(72,201,176,0.3)'  },
  vip:       { bg: 'rgba(201,168,76,0.2)',  color: '#C9A84C',                border: 'rgba(201,168,76,0.6)'  },
}

export function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente', invited: 'Invitado', confirmed: 'Confirmado',
    declined: 'Declinó', purchased: 'Compró', waitlist: 'Lista espera',
    imported: 'Importado', vip: 'VIP',
  }
  return map[s] ?? s
}

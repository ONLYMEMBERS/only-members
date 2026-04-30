import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

export function getMPClient(accessToken?: string) {
  return new MercadoPagoConfig({
    accessToken: accessToken || process.env.MP_ACCESS_TOKEN!,
  })
}

export { Preference, Payment }

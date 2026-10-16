// Paquetes de créditos propuestos. 1 crédito = 1 uso de IA (una imagen o un texto); la tabla
// cuesta 2 y el audio 1 por cada ~100 s. Con un costo de IA de ~US$0.003 por uso, cada paquete
// deja más de US$1 de margen aun si el usuario gasta todo y el procesador cobra ~5%+US$0.30.
// Los precios son una propuesta: se pueden cambiar aquí sin tocar el resto.
// Debe coincidir con el saldo de bienvenida del trigger `handle_new_user` (supabase/migrations).
export const WELCOME_CREDITS = 5

export type CreditPack = { id: string; credits: number; priceUsd: number }

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'basico', credits: 100, priceUsd: 2 },
  { id: 'plus', credits: 300, priceUsd: 5 },
  { id: 'pro', credits: 800, priceUsd: 12 },
]

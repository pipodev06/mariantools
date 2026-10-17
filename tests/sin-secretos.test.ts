import { describe, expect, it } from 'vitest'

// Guardia: las pruebas no deben cargar `.env.local` (ver vitest.config.ts). Solo se compara un booleano
// para que, si falla, el mensaje nunca muestre el valor de una clave.
describe('entorno de pruebas', () => {
  it('no recibe claves reales de IA ni de Supabase', () => {
    const cargadas = Object.keys(process.env).some(
      (key) => /^(AI_|SUPABASE_|VITE_SUPABASE_|BILLING_SALT)/.test(key) && key !== 'AI_AGENT' && Boolean(process.env[key]),
    )
    expect(cargadas).toBe(false)
  })
})

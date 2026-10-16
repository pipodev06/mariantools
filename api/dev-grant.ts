import type { VercelRequest, VercelResponse } from '@vercel/node'
import { grant } from './_billing.js'
import { getUserId } from './_supabase.js'

// Solo para desarrollo: acredita créditos de prueba al usuario con sesión iniciada.
// En producción no existe (404). El cobro real lo hará el webhook del proveedor de pagos.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const userId = await getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Inicia sesión' })
    return
  }

  const amount = Number((req.body as { amount?: unknown } | undefined)?.amount)
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1000) {
    res.status(400).json({ error: 'Cantidad no válida' })
    return
  }

  try {
    const balance = await grant(userId, amount, 'dev', `dev:${userId}:${Date.now()}`)
    res.status(200).json({ balance })
  } catch (err) {
    console.error('Falló dev-grant', err)
    res.status(502).json({ error: 'No se pudo acreditar' })
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { freeQuota } from './_billing.js'

// Cupo gratis que le queda hoy al visitante o usuario, para mostrarlo antes de usar una herramienta con IA.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  res.status(200).json(await freeQuota(req))
}

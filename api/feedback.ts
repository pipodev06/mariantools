import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConfig, getUserId, hashedIp, insertRow, rpc } from './_supabase.js'

// Recibe comentarios y sugerencias del formulario y los guarda en Supabase (solo el servidor puede leerlos).
const KINDS = ['sugerencia', 'comentario', 'error']
const MIN_MESSAGE = 10
const MAX_MESSAGE = 2000
const MAX_EMAIL = 200
const MAX_PAGE = 200
const DAILY_LIMIT = 5
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Body = { kind?: unknown; message?: unknown; email?: unknown; page?: unknown; website?: unknown }

const text = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Body

  // Campo trampa: los bots lo llenan, las personas no lo ven. Se responde "ok" sin guardar nada.
  if (typeof body.website === 'string' && body.website) {
    res.status(200).json({ ok: true })
    return
  }

  const message = text(body.message, MAX_MESSAGE)
  const email = body.email ? text(body.email, MAX_EMAIL) : null
  if (
    typeof body.kind !== 'string' ||
    !KINDS.includes(body.kind) ||
    !message ||
    message.length < MIN_MESSAGE ||
    (body.email && (!email || !EMAIL_FORMAT.test(email)))
  ) {
    res.status(400).json({ error: `Escribe un mensaje de al menos ${MIN_MESSAGE} caracteres y revisa tu correo.` })
    return
  }
  const page = body.page ? text(body.page, MAX_PAGE) : null

  const config = getConfig()
  if (!config) {
    // Sin Supabase solo se acepta en desarrollo (no se guarda nada).
    if (process.env.NODE_ENV === 'production') {
      console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
      res.status(503).json({ error: 'Servicio no disponible' })
      return
    }
    res.status(200).json({ ok: true })
    return
  }

  try {
    // Mismo contador diario que el cupo gratis de IA, con otra clave: máximo 5 mensajes por día y por IP.
    const allowed = await rpc<boolean>(config, 'consume_free_quota', {
      p_key: `feedback:${hashedIp(req)}`,
      p_limit: DAILY_LIMIT,
    })
    if (!allowed) {
      res.status(429).json({ error: 'Ya enviaste varios mensajes hoy. Inténtalo mañana.' })
      return
    }

    await insertRow(config, 'feedback', {
      kind: body.kind,
      message,
      email,
      page,
      user_id: await getUserId(req, config),
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Falló el guardado de comentarios', err)
    res.status(502).json({ error: 'No se pudo enviar tu mensaje. Inténtalo de nuevo.' })
  }
}

import type { VercelRequest } from '@vercel/node'
import { createHash, randomUUID } from 'node:crypto'

// Medición de uso de IA: cupo gratis diario y créditos prepagados guardados en Supabase.
// Habla con Supabase por REST (sin SDK) usando la service_role key, que solo existe en el servidor.
// El archivo empieza con `_`, así que Vercel no lo expone como endpoint.

const FREE_DAILY_USES = Number(process.env.FREE_DAILY_USES ?? 3)
const SUPABASE_TIMEOUT_MS = 8_000

type Config = { url: string; key: string }

const getConfig = (): Config | null => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? { url: url.replace(/\/+$/, ''), key } : null
}

const rpc = async <T>(config: Config, fn: string, args: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${config.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`rpc ${fn} respondió ${response.status}`)
  return (await response.json()) as T
}

/** Devuelve el id del usuario si el JWT del header Authorization es válido; si no, null. */
export const getUserId = async (req: VercelRequest, config = getConfig()): Promise<string | null> => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token || !config) return null

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.key, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  })
  if (!response.ok) return null
  const user = (await response.json()) as { id?: string }
  return user.id ?? null
}

// Solo se guarda un hash de la IP (con sal), nunca la IP.
const hashedIp = (req: VercelRequest): string => {
  const forwarded = req.headers['x-forwarded-for']
  const raw = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim()
  const ip = raw || req.socket?.remoteAddress || 'unknown'
  return createHash('sha256')
    .update(`${process.env.BILLING_SALT ?? ''}${ip}`)
    .digest('hex')
    .slice(0, 32)
}

export type Reservation = {
  /** Créditos descontados (0 si se usó el cupo gratis o no hay medición). */
  charged: number
  userId: string | null
  quotaKey: string | null
  ref: string
}

export type Denied = { status: number; code: string; error: string }

export const isDenied = (value: Reservation | Denied): value is Denied => 'status' in value

/**
 * Reserva el uso antes de llamar a la IA: primero el cupo gratis del día y, si se agotó,
 * créditos del usuario. Sin cuenta ni cupo devuelve 401; sin saldo, 402.
 */
export const reserve = async (
  req: VercelRequest,
  tool: string,
  cost: number,
): Promise<Reservation | Denied> => {
  const ref = randomUUID()
  const config = getConfig()

  if (!config) {
    // Sin Supabase configurado solo se permite en desarrollo: en producción se cierra.
    if (process.env.NODE_ENV === 'production') {
      console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
      return { status: 503, code: 'unavailable', error: 'Servicio no disponible' }
    }
    return { charged: 0, userId: null, quotaKey: null, ref }
  }

  try {
    const userId = await getUserId(req, config)
    const quotaKey = userId ? `u:${userId}` : `ip:${hashedIp(req)}`

    const free = await rpc<boolean>(config, 'consume_free_quota', {
      p_key: quotaKey,
      p_limit: FREE_DAILY_USES,
    })
    if (free) return { charged: 0, userId, quotaKey, ref }

    if (!userId) {
      return {
        status: 401,
        code: 'login_required',
        error: 'Llegaste al límite gratis de hoy. Inicia sesión para usar tus créditos.',
      }
    }

    const balance = await rpc<number>(config, 'spend_credits', {
      p_user: userId,
      p_amount: cost,
      p_tool: tool,
      p_ref: ref,
    })
    if (balance < 0) {
      return { status: 402, code: 'no_credits', error: 'No tienes créditos suficientes.' }
    }
    return { charged: cost, userId, quotaKey: null, ref }
  } catch (err) {
    console.error('Falló la reserva de uso', err)
    return { status: 503, code: 'unavailable', error: 'Servicio no disponible' }
  }
}

/** Devuelve el uso (créditos o cupo gratis) cuando la IA no pudo responder. */
export const refund = async (reservation: Reservation, tool: string): Promise<void> => {
  const config = getConfig()
  if (!config) return

  try {
    if (reservation.charged > 0 && reservation.userId) {
      await rpc(config, 'refund_credits', {
        p_user: reservation.userId,
        p_amount: reservation.charged,
        p_tool: tool,
        p_ref: reservation.ref,
      })
    } else if (reservation.quotaKey) {
      await rpc(config, 'refund_free_quota', { p_key: reservation.quotaKey })
    }
  } catch (err) {
    console.error('Falló la devolución de uso', err)
  }
}

/** Acredita créditos a un usuario. Lo usará el webhook de pagos y el endpoint de pruebas. */
export const grant = async (
  userId: string,
  amount: number,
  reason: string,
  ref: string,
): Promise<number | null> => {
  const config = getConfig()
  if (!config) return null
  return rpc<number>(config, 'grant_credits', {
    p_user: userId,
    p_amount: amount,
    p_reason: reason,
    p_ref: ref,
  })
}

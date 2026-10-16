import type { VercelRequest } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { SUPABASE_TIMEOUT_MS, getConfig, getUserId, hashedIp, rpc } from './_supabase.js'

// Medición de uso de IA: cupo gratis diario y créditos prepagados guardados en Supabase.
// Habla con Supabase a través de `_supabase.ts`. El archivo empieza con `_`, así que Vercel no lo
// expone como endpoint.

const FREE_DAILY_USES = Number(process.env.FREE_DAILY_USES ?? 3)

/** Usos gratis que le quedan hoy a quien llama (por cuenta o por IP). `remaining` es null sin medición. */
export const freeQuota = async (
  req: VercelRequest,
): Promise<{ limit: number; remaining: number | null }> => {
  const config = getConfig()
  if (!config) return { limit: FREE_DAILY_USES, remaining: null }

  try {
    const userId = await getUserId(req, config)
    const key = userId ? `u:${userId}` : `ip:${hashedIp(req)}`
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
    const response = await fetch(
      `${config.url}/rest/v1/free_usage?key=eq.${encodeURIComponent(key)}&day=eq.${day}&select=uses`,
      {
        headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
        signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
      },
    )
    if (!response.ok) throw new Error(`free_usage respondió ${response.status}`)
    const rows = (await response.json()) as { uses: number }[]
    return { limit: FREE_DAILY_USES, remaining: Math.max(FREE_DAILY_USES - (rows[0]?.uses ?? 0), 0) }
  } catch (err) {
    console.error('Falló la consulta del cupo gratis', err)
    return { limit: FREE_DAILY_USES, remaining: null }
  }
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

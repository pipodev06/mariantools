import type { VercelRequest } from '@vercel/node'
import { createHash } from 'node:crypto'

// Acceso a Supabase por REST (sin SDK) con la service_role key, que solo existe en el servidor.
// Lo comparten la medición de uso (`_billing`) y los comentarios (`feedback`). Empieza con `_`:
// Vercel no lo expone como endpoint.

export const SUPABASE_TIMEOUT_MS = 8_000

export type Config = { url: string; key: string }

export const getConfig = (): Config | null => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && key ? { url: url.replace(/\/+$/, ''), key } : null
}

export const rpc = async <T>(config: Config, fn: string, args: Record<string, unknown>): Promise<T> => {
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

/** Inserta una fila en una tabla (la service_role se salta las políticas RLS). */
export const insertRow = async (config: Config, table: string, row: Record<string, unknown>): Promise<void> => {
  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`insert en ${table} respondió ${response.status}`)
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
export const hashedIp = (req: VercelRequest): string => {
  const forwarded = req.headers['x-forwarded-for']
  const raw = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0].trim()
  const ip = raw || req.socket?.remoteAddress || 'unknown'
  return createHash('sha256')
    .update(`${process.env.BILLING_SALT ?? ''}${ip}`)
    .digest('hex')
    .slice(0, 32)
}

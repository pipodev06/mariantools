import { refreshAccount } from './account'
import { authHeaders } from './supabase'

/** Error de la API de IA; `code` distingue "inicia sesión" y "sin créditos" de un fallo cualquiera. */
export class AiError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AiError'
    this.code = code
  }
}

export const NEEDS_ACCOUNT_CODES = ['login_required', 'no_credits']

/** Convierte una respuesta con error de nuestra API en un AiError. */
export const toAiError = async (response: Response, fallback: string): Promise<AiError> => {
  const body = await response.json().catch(() => null)
  return new AiError(body?.error ?? fallback, body?.code)
}

// Caché de la sesión: el mismo archivo con la misma tarea y opciones se resuelve al instante y sin gastar cupo.
const CACHE_LIMIT = 40
const cache = new Map<string, string>()

const cacheKey = async (body: Record<string, unknown>): Promise<string | null> => {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(body))
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

/** Llama a `api/ai.ts`, que arma el prompt de cada tarea y le pega al proveedor de IA configurado (key server-side). */
export const callAi = async (body: Record<string, unknown>): Promise<string> => {
  const key = await cacheKey(body)
  const cached = key ? cache.get(key) : undefined
  if (cached !== undefined) return cached

  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  })
  // El uso ya se cobró o se devolvió en el servidor: se actualizan saldo y cupo en pantalla.
  refreshAccount()

  if (!response.ok) throw await toAiError(response, 'No se pudo completar la operación con IA')

  const { result } = (await response.json()) as { result: string }
  const text = result.trim()
  if (key && text) {
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
    cache.set(key, text)
  }
  return text
}

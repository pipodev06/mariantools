import { getSupabase } from './supabase'

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

/** Header con la sesión del usuario (si la hay) para que el servidor descuente sus créditos. */
export const authHeaders = async (): Promise<Record<string, string>> => {
  const supabase = await getSupabase()
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Convierte una respuesta con error de nuestra API en un AiError. */
export const toAiError = async (response: Response, fallback: string): Promise<AiError> => {
  const body = await response.json().catch(() => null)
  return new AiError(body?.error ?? fallback, body?.code)
}

/** Llama a `api/ai.ts`, que arma el prompt de cada tarea y le pega al proveedor de IA configurado (key server-side). */
export const callAi = async (body: Record<string, unknown>): Promise<string> => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw await toAiError(response, 'No se pudo completar la operación con IA')

  const { result } = (await response.json()) as { result: string }
  return result.trim()
}

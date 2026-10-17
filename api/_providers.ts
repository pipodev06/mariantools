// Proveedores de IA intercambiables (cualquier API compatible con OpenAI) con rotación y respaldo.
// Se configuran solo por variables de entorno, sin nombres de modelo ni URLs en el código:
//   AI_1_API_KEY / AI_1_BASE_URL / AI_1_MODEL (y AI_2_*, AI_3_* ... hasta AI_6_*) para texto y visión,
//   AI_AUDIO_1_* ... para transcripción. Sin numerados, se usan AI_API_KEY / AI_BASE_URL / AI_MODEL
//   (y AI_AUDIO_* para audio) como un único proveedor.

export type Provider = { name: string; apiKey: string; model: string; baseUrl: string }

const MAX_PROVIDERS = 6

export const getProviders = (kind: 'chat' | 'audio'): Provider[] => {
  const env = process.env
  const prefix = kind === 'chat' ? 'AI' : 'AI_AUDIO'
  const list: Provider[] = []
  for (let i = 1; i <= MAX_PROVIDERS; i++) {
    const apiKey = env[`${prefix}_${i}_API_KEY`]
    const baseUrl = env[`${prefix}_${i}_BASE_URL`]
    const model = env[`${prefix}_${i}_MODEL`]
    if (apiKey && baseUrl && model) list.push({ name: `${prefix}_${i}`, apiKey, baseUrl, model })
  }
  if (list.length > 0) return list

  const apiKey = kind === 'chat' ? env.AI_API_KEY : env.AI_AUDIO_API_KEY || env.AI_API_KEY
  const baseUrl = kind === 'chat' ? env.AI_BASE_URL : env.AI_AUDIO_BASE_URL || env.AI_BASE_URL
  const model = kind === 'chat' ? env.AI_MODEL : env.AI_AUDIO_MODEL
  return apiKey && baseUrl && model ? [{ name: prefix, apiKey, baseUrl, model }] : []
}

export const endpoint = (provider: Provider, path: string) => `${provider.baseUrl.replace(/\/+$/, '')}${path}`

const TOTAL_BUDGET_MS = 28_000
const PER_ATTEMPT_MS = 12_000
const MIN_ATTEMPT_MS = 3_000
// Si un proveedor no responde en este tiempo, se lanza el siguiente en paralelo y gana el primero que conteste.
const HEDGE_AFTER_MS = 5_000
const SAME_PROVIDER_RETRY_DELAY_MS = 1_000

export type FailoverResult =
  | { response: Response }
  | { response: null; status: number | null; timedOut: boolean }

/**
 * Llama a los proveedores en orden rotado al azar (reparte la carga entre cuotas gratuitas). Pasa al
 * siguiente ante cualquier fallo (límite 429, error de servidor, modelo sin soporte, tiempo agotado) y,
 * si uno tarda más de HEDGE_AFTER_MS, lanza el siguiente sin cancelar el primero: gana el que responda antes.
 * Con un solo proveedor lo reintenta una vez, sin paralelo. Todo dentro de los 30 s de `maxDuration`.
 */
export const callWithFailover = (
  providers: Provider[],
  attempt: (provider: Provider, signal: AbortSignal) => Promise<Response>,
): Promise<FailoverResult> => {
  const start = Math.floor(Math.random() * providers.length)
  const ordered = [...providers.slice(start), ...providers.slice(0, start)]
  if (ordered.length === 1) ordered.push(ordered[0])

  const startedAt = Date.now()
  const controllers = new Set<AbortController>()

  return new Promise((resolve) => {
    let next = 0
    let pending = 0
    let settled = false
    let lastStatus: number | null = null
    let timedOut = false
    let hedgeTimer: ReturnType<typeof setTimeout> | undefined

    const finish = (result: FailoverResult, winner?: AbortController) => {
      if (settled) return
      settled = true
      clearTimeout(hedgeTimer)
      for (const c of controllers) if (c !== winner) c.abort()
      resolve(result)
    }

    const launch = () => {
      if (settled) return
      const remaining = TOTAL_BUDGET_MS - (Date.now() - startedAt)
      if (next >= ordered.length || remaining < MIN_ATTEMPT_MS) {
        if (pending === 0) finish({ response: null, status: lastStatus, timedOut })
        return
      }
      const provider = ordered[next]
      const repeated = next > 0 && ordered[next - 1] === provider
      next++
      pending++

      const run = () => {
        if (settled) return
        const left = TOTAL_BUDGET_MS - (Date.now() - startedAt)
        const controller = new AbortController()
        controllers.add(controller)
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(Math.min(PER_ATTEMPT_MS, left))])
        attempt(provider, signal)
          .then(async (response) => {
            if (settled) return
            if (response.ok) return finish({ response }, controller)
            lastStatus = response.status
            timedOut = false
            console.error('Proveedor de IA error', provider.name, response.status, (await response.text()).slice(0, 300))
            pending--
            launch()
          })
          .catch((err) => {
            if (settled) return
            lastStatus = null
            timedOut = err instanceof Error && err.name === 'TimeoutError'
            console.error('Proveedor de IA fetch falló', provider.name, err)
            pending--
            launch()
          })
      }

      if (repeated) setTimeout(run, SAME_PROVIDER_RETRY_DELAY_MS)
      else run()

      // En paralelo solo si el siguiente es otro proveedor distinto.
      clearTimeout(hedgeTimer)
      if (next < ordered.length && ordered[next] !== provider) hedgeTimer = setTimeout(launch, HEDGE_AFTER_MS)
    }

    launch()
  })
}

/** Mensaje y estado HTTP para el cliente: solo se expone 429 (límite) y tiempo agotado. */
export const failureResponse = (result: Extract<FailoverResult, { response: null }>, fallback: string) => {
  if (result.status === 429) return { status: 429, error: 'Demasiadas solicitudes, intenta en un momento' }
  if (result.timedOut) return { status: 504, error: 'La IA tardó demasiado, intenta de nuevo' }
  return { status: 502, error: fallback }
}

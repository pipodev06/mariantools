import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callWithFailover, failureResponse, getProviders, type Provider } from '../api/_providers'

const provider = (name: string): Provider => ({ name, apiKey: 'k', baseUrl: 'https://x', model: name })
const respond = (status: number, delayMs = 0) => (_p: Provider, signal: AbortSignal) =>
  new Promise<Response>((resolve, reject) => {
    const t = setTimeout(() => resolve(new Response('{}', { status })), delayMs)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(signal.reason)
    })
  })

// Las pruebas nunca deben ver variables reales: se vacían todas las AI_* antes de cada caso.
beforeEach(() => {
  for (const key of Object.keys(process.env)) if (key.startsWith('AI_')) vi.stubEnv(key, '')
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('callWithFailover', () => {
  it('pasa al siguiente proveedor ante un 429', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const calls: string[] = []
    const result = await callWithFailover([provider('A'), provider('B')], (p, s) => {
      calls.push(p.name)
      return respond(p.name === 'A' ? 429 : 200)(p, s)
    })
    expect(result.response?.ok).toBe(true)
    expect(calls).toEqual(['A', 'B'])
  })

  it('si todos fallan con 429, informa 429', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = await callWithFailover([provider('A'), provider('B')], respond(429))
    expect(result.response).toBeNull()
    if (result.response === null) expect(failureResponse(result, 'x').status).toBe(429)
  })

  it('lanza el siguiente en paralelo si el primero tarda y gana el más rápido', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const promise = callWithFailover([provider('lento'), provider('rapido')], (p, s) =>
      respond(200, p.name === 'lento' ? 8000 : 1000)(p, s),
    )
    await vi.advanceTimersByTimeAsync(6100)
    const result = await promise
    expect(result.response?.ok).toBe(true)
  })

  it('con un solo proveedor reintenta una vez', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let calls = 0
    const promise = callWithFailover([provider('solo')], (p, s) => {
      calls++
      return respond(calls === 1 ? 503 : 200)(p, s)
    })
    await vi.advanceTimersByTimeAsync(1500)
    expect((await promise).response?.ok).toBe(true)
    expect(calls).toBe(2)
  })
})

describe('getProviders', () => {
  it('los juegos numerados reemplazan al juego simple', () => {
    vi.stubEnv('AI_API_KEY', 'simple')
    vi.stubEnv('AI_BASE_URL', 'https://simple')
    vi.stubEnv('AI_MODEL', 'simple')
    vi.stubEnv('AI_1_API_KEY', 'a')
    vi.stubEnv('AI_1_BASE_URL', 'https://a')
    vi.stubEnv('AI_1_MODEL', 'm1')
    vi.stubEnv('AI_2_MODEL', 'incompleto')
    expect(getProviders('chat').map((p) => p.model)).toEqual(['m1'])
  })

  it('el audio usa sus propias variables', () => {
    vi.stubEnv('AI_AUDIO_API_KEY', 'g')
    vi.stubEnv('AI_AUDIO_BASE_URL', 'https://groq')
    vi.stubEnv('AI_AUDIO_MODEL', 'whisper')
    expect(getProviders('audio')).toEqual([{ name: 'AI_AUDIO', apiKey: 'g', baseUrl: 'https://groq', model: 'whisper' }])
  })
})

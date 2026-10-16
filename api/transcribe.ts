import type { VercelRequest, VercelResponse } from '@vercel/node'

import { isDenied, refund, reserve } from './_billing.js'

const AI_TIMEOUT_MS = 25_000
// Cada trozo de audio (~100 s) cuesta 1 crédito.
const AUDIO_CHUNK_COST = 1

// Proveedor de transcripción intercambiable: cualquier API compatible con OpenAI
// (/audio/transcriptions). Si AI_AUDIO_* no está definido, reutiliza AI_API_KEY y AI_BASE_URL;
// el modelo (AI_AUDIO_MODEL) siempre es explícito porque el de texto/visión no sirve para audio.
const getConfig = () => {
  const env = process.env
  const apiKey = env.AI_AUDIO_API_KEY || env.AI_API_KEY
  const baseUrl = env.AI_AUDIO_BASE_URL || env.AI_BASE_URL
  const model = env.AI_AUDIO_MODEL
  if (!apiKey || !baseUrl || !model) return null
  return { apiKey, model, url: `${baseUrl.replace(/\/+$/, '')}/audio/transcriptions` }
}

// Vercel corta los cuerpos de más de 4.5 MB; el cliente manda trozos WAV más chicos.
const MAX_AUDIO_BYTES = 4_400_000

const readBody = async (req: VercelRequest): Promise<Buffer | null> => {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_AUDIO_BYTES) return null
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

const isWav = (audio: Buffer) =>
  audio.length > 44 &&
  audio.toString('ascii', 0, 4) === 'RIFF' &&
  audio.toString('ascii', 8, 12) === 'WAVE'

// El cuerpo es el audio crudo (audio/wav): no se toca `req.body` para que Vercel no lo parsee.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const config = getConfig()
  if (!config) {
    console.error('Faltan AI_AUDIO_MODEL y la key/URL (AI_AUDIO_* o AI_API_KEY y AI_BASE_URL)')
    res.status(503).json({ error: 'Servicio no disponible' })
    return
  }

  if (!req.headers['content-type']?.startsWith('audio/wav')) {
    res.status(400).json({ error: 'El audio debe enviarse como audio/wav' })
    return
  }

  const audio = await readBody(req)
  if (!audio || !isWav(audio)) {
    res.status(400).json({ error: 'Audio vacío, demasiado grande o no es WAV' })
    return
  }

  const reservation = await reserve(req, 'audio', AUDIO_CHUNK_COST)
  if (isDenied(reservation)) {
    res.status(reservation.status).json({ error: reservation.error, code: reservation.code })
    return
  }

  // Si la IA falla, se devuelve el uso reservado antes de responder el error.
  const fail = async (status: number, error: string) => {
    await refund(reservation, 'audio')
    res.status(status).json({ error })
  }

  try {
    const form = new FormData()
    form.append('model', config.model)
    form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), 'audio.wav')

    const aiResponse = await fetch(config.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    })

    if (!aiResponse.ok) {
      console.error('Proveedor de IA error', aiResponse.status, await aiResponse.text())
      if (aiResponse.status === 429) {
        await fail(429, 'Demasiadas solicitudes, intenta en un momento')
      } else {
        await fail(502, 'La IA no pudo procesar el audio')
      }
      return
    }

    const data = (await aiResponse.json()) as { text?: string }
    res.status(200).json({ text: data.text ?? '' })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError'
    console.error('Proveedor de IA fetch falló', err)
    if (timedOut) {
      await fail(504, 'La IA tardó demasiado, intenta de nuevo')
    } else {
      await fail(502, 'No se pudo contactar a la IA')
    }
  }
}

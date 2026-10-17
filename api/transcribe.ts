import type { VercelRequest, VercelResponse } from '@vercel/node'

import { isDenied, refund, reserve } from './_billing.js'
import { callWithFailover, endpoint, failureResponse, getProviders } from './_providers.js'

// Cada trozo de audio (~100 s) cuesta 1 crédito.
const AUDIO_CHUNK_COST = 1

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

  const providers = getProviders('audio')
  if (providers.length === 0) {
    console.error('Faltan AI_AUDIO_MODEL y la key/URL (AI_AUDIO_* o AI_API_KEY y AI_BASE_URL, o AI_AUDIO_1_*)')
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

  const result = await callWithFailover(providers, (provider, signal) => {
    const form = new FormData()
    form.append('model', provider.model)
    form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), 'audio.wav')
    return fetch(endpoint(provider, '/audio/transcriptions'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${provider.apiKey}` },
      body: form,
      signal,
    })
  })
  if (!result.response) {
    const { status, error } = failureResponse(result, 'La IA no pudo procesar el audio')
    await fail(status, error)
    return
  }

  try {
    const data = (await result.response.json()) as { text?: string }
    res.status(200).json({ text: data.text ?? '' })
  } catch (err) {
    console.error('Respuesta de IA no válida', err)
    await fail(502, 'La IA no pudo procesar el audio')
  }
}

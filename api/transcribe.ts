import type { VercelRequest, VercelResponse } from '@vercel/node'

const MISTRAL_TRANSCRIBE_URL = 'https://api.mistral.ai/v1/audio/transcriptions'
const MISTRAL_AUDIO_MODEL = 'voxtral-mini-latest'
const MISTRAL_TIMEOUT_MS = 25_000

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

  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    console.error('MISTRAL_API_KEY no configurada')
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

  try {
    const form = new FormData()
    form.append('model', MISTRAL_AUDIO_MODEL)
    form.append('file', new Blob([new Uint8Array(audio)], { type: 'audio/wav' }), 'audio.wav')

    const mistralResponse = await fetch(MISTRAL_TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(MISTRAL_TIMEOUT_MS),
    })

    if (!mistralResponse.ok) {
      console.error('Mistral error', mistralResponse.status, await mistralResponse.text())
      const busy = mistralResponse.status === 429
      res
        .status(busy ? 429 : 502)
        .json({ error: busy ? 'Demasiadas solicitudes, intenta en un momento' : 'La IA no pudo procesar el audio' })
      return
    }

    const data = (await mistralResponse.json()) as { text?: string }
    res.status(200).json({ text: data.text ?? '' })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError'
    console.error('Mistral fetch falló', err)
    res
      .status(timedOut ? 504 : 502)
      .json({ error: timedOut ? 'La IA tardó demasiado, intenta de nuevo' : 'No se pudo contactar a la IA' })
  }
}

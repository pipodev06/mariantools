import type { VercelRequest, VercelResponse } from '@vercel/node'

const AI_TIMEOUT_MS = 25_000

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
      const busy = aiResponse.status === 429
      res
        .status(busy ? 429 : 502)
        .json({ error: busy ? 'Demasiadas solicitudes, intenta en un momento' : 'La IA no pudo procesar el audio' })
      return
    }

    const data = (await aiResponse.json()) as { text?: string }
    res.status(200).json({ text: data.text ?? '' })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError'
    console.error('Proveedor de IA fetch falló', err)
    res
      .status(timedOut ? 504 : 502)
      .json({ error: timedOut ? 'La IA tardó demasiado, intenta de nuevo' : 'No se pudo contactar a la IA' })
  }
}

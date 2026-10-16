import { refreshAccount } from './account'
import { toAiError } from './aiClient'
import { authHeaders } from './supabase'

const TARGET_SAMPLE_RATE = 16000
// 100 s a 16 kHz mono de 16 bits ≈ 3.2 MB: cabe bajo el límite de 4.5 MB de Vercel.
const CHUNK_SECONDS = 100
export const MAX_AUDIO_FILE_BYTES = 20 * 1024 * 1024

/** Decodifica el archivo y lo deja en mono a 16 kHz (lo que necesita el modelo, y pesa poco). */
const decodeToMono16k = async (file: File): Promise<Float32Array> => {
  const context = new AudioContext()
  let decoded: AudioBuffer
  try {
    decoded = await context.decodeAudioData(await file.arrayBuffer())
  } catch {
    throw new Error('No se pudo leer el audio. Prueba con MP3, WAV, M4A u OGG.')
  } finally {
    await context.close()
  }

  const length = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE)
  const offline = new OfflineAudioContext(1, length, TARGET_SAMPLE_RATE)
  const source = offline.createBufferSource()
  source.buffer = decoded
  source.connect(offline.destination)
  source.start()
  return (await offline.startRendering()).getChannelData(0)
}

const encodeWav = (samples: Float32Array): Blob => {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeText(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeText(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, TARGET_SAMPLE_RATE, true)
  view.setUint32(28, TARGET_SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

const transcribeChunk = async (wav: Blob): Promise<string> => {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav', ...(await authHeaders()) },
    body: wav,
  })
  refreshAccount()

  if (!response.ok) throw await toAiError(response, 'No se pudo transcribir el audio')

  const { text } = (await response.json()) as { text: string }
  return text.trim()
}

/** Transcribe en trozos de ~100 s (límite de cuerpo de Vercel) y los une en orden. */
export const transcribeAudio = async (
  file: File,
  onProgress: (done: number, total: number) => void,
): Promise<string> => {
  if (file.size > MAX_AUDIO_FILE_BYTES) {
    throw new Error('El audio pesa más de 20 MB')
  }

  const samples = await decodeToMono16k(file)
  const chunkSize = CHUNK_SECONDS * TARGET_SAMPLE_RATE
  const total = Math.max(1, Math.ceil(samples.length / chunkSize))
  const parts: string[] = []

  for (let i = 0; i < total; i++) {
    onProgress(i, total)
    parts.push(await transcribeChunk(encodeWav(samples.subarray(i * chunkSize, (i + 1) * chunkSize))))
  }
  onProgress(total, total)
  return parts.join(' ')
}

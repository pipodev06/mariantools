import { createWorker, OEM, type Worker } from 'tesseract.js'

const MAX_DIMENSION = 2000

export type OcrResult = {
  text: string
  confidence: number
}

/**
 * Corre `fn` sobre `items` con un máximo de `limit` tareas en simultáneo.
 * Pensado para el motor con IA (llamadas de red, no CPU local) — el motor
 * Tesseract sigue siendo secuencial porque un solo worker procesa de a uno.
 */
export const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = new Array(items.length)
  let cursor = 0

  const runNext = async (): Promise<void> => {
    while (cursor < items.length) {
      const current = cursor++
      results[current] = await fn(items[current], current)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext))
  return results
}

const loadBitmap = (file: File) => createImageBitmap(file)

// Achica imágenes gigantes (fotos de celular, 4000px+) antes de procesar.
// Tesseract y Mistral no ganan precisión pasado cierto tamaño, solo tiempo.
const drawScaled = (bitmap: ImageBitmap): HTMLCanvasElement => {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

const rotateCanvas = (source: HTMLCanvasElement, degrees: number): HTMLCanvasElement => {
  if (degrees === 0) return source

  const canvas = document.createElement('canvas')
  const swapped = degrees === 90 || degrees === 270
  canvas.width = swapped ? source.height : source.width
  canvas.height = swapped ? source.width : source.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(source, -source.width / 2, -source.height / 2)
  return canvas
}

const normalizeRotation = (degrees: number): 0 | 90 | 180 | 270 => {
  const normalized = (((Math.round(degrees / 90) * 90) % 360) + 360) % 360
  return normalized as 0 | 90 | 180 | 270
}

// Escala de grises + umbral suave: mejora el contraste de escaneos borrosos
// o con poca luz antes de pasarlos a Tesseract, sin perder detalle de letras finas.
const enhanceForOcr = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const value = gray > 160 ? 255 : gray < 100 ? 0 : gray
    data[i] = data[i + 1] = data[i + 2] = value
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// `legacyCore`/`legacyLang` habilitan worker.detect() (OSD), que usa el motor
// legacy de Tesseract solo para detectar orientación — no afecta la precisión
// del reconocimiento final, que sigue corriendo en LSTM (OEM.LSTM_ONLY).
export const createOcrWorker = (): Promise<Worker> =>
  createWorker('spa+eng', OEM.LSTM_ONLY, { legacyCore: true, legacyLang: true })

/**
 * Detecta la orientación con OSD (rápido, modelo dedicado) y reconoce una
 * sola vez en la rotación corregida. Antes se probaban las 4 rotaciones con
 * reconocimiento completo cada una — esto es ~3-4x más rápido por imagen.
 */
export const recognizeWithTesseract = async (
  worker: Worker,
  file: File,
): Promise<OcrResult> => {
  const bitmap = await loadBitmap(file)
  const scaled = drawScaled(bitmap)

  let rotation: 0 | 90 | 180 | 270 = 0
  try {
    const { data } = await worker.detect(scaled)
    if (data.orientation_degrees) rotation = normalizeRotation(data.orientation_degrees)
  } catch {
    // Si el detect falla, seguimos sin rotar en vez de cortar la conversión.
  }

  const canvas = enhanceForOcr(rotateCanvas(scaled, rotation))
  const { data } = await worker.recognize(canvas)
  return { text: data.text.trim(), confidence: data.confidence }
}

const canvasToDataUrl = (canvas: HTMLCanvasElement): string =>
  canvas.toDataURL('image/jpeg', 0.85)

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

/**
 * Llama al backend propio (`api/ocr-ai.ts`), que a su vez le pega a Mistral
 * Pixtral con la API key server-side. Nunca se expone la key al navegador.
 * La imagen se achica/comprime antes de mandarla para que suba más rápido.
 */
export const recognizeWithMistral = async (file: File): Promise<OcrResult> => {
  let image: string
  try {
    const bitmap = await loadBitmap(file)
    image = canvasToDataUrl(drawScaled(bitmap))
  } catch {
    image = await fileToDataUrl(file)
  }

  const response = await fetch('/api/ocr-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? 'No se pudo reconocer la imagen con IA')
  }

  const data = await response.json()
  return { text: (data.text as string).trim(), confidence: 100 }
}

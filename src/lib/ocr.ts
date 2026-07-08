import { createWorker, type Worker } from 'tesseract.js'

const ROTATIONS = [0, 90, 180, 270] as const

export type OcrResult = {
  text: string
  confidence: number
}

const loadBitmap = (file: File) => createImageBitmap(file)

const drawRotated = (bitmap: ImageBitmap, degrees: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  const swapped = degrees === 90 || degrees === 270
  canvas.width = swapped ? bitmap.height : bitmap.width
  canvas.height = swapped ? bitmap.width : bitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  return canvas
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

export const createOcrWorker = (): Promise<Worker> => createWorker('spa+eng')

/**
 * Prueba las 4 rotaciones (0/90/180/270) y se queda con la de mayor confianza.
 * Es una heurística, no un clasificador de orientación dedicado, pero permite
 * leer imágenes giradas sin depender del modelo OSD adicional de Tesseract.
 */
export const recognizeWithTesseract = async (
  worker: Worker,
  file: File,
): Promise<OcrResult> => {
  const bitmap = await loadBitmap(file)
  let best: OcrResult = { text: '', confidence: -1 }

  for (const degrees of ROTATIONS) {
    const canvas = enhanceForOcr(drawRotated(bitmap, degrees))
    const { data } = await worker.recognize(canvas)
    if (data.confidence > best.confidence) {
      best = { text: data.text.trim(), confidence: data.confidence }
    }
  }

  return best
}

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
 */
export const recognizeWithMistral = async (file: File): Promise<OcrResult> => {
  const image = await fileToDataUrl(file)
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

import { createWorker, OEM, type Worker } from 'tesseract.js'
import { callAi } from './aiClient'

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

const toGray = (imageData: ImageData): Uint8ClampedArray => {
  const { data, width, height } = imageData
  const gray = new Uint8ClampedArray(width * height)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return gray
}

// Binarización adaptativa (Bradley): un píxel es "tinta" si es más oscuro que el
// promedio de su vecindario. Usa imagen integral, O(n). A diferencia de un umbral
// fijo, aguanta sombras e iluminación despareja. Devuelve 1 = tinta, 0 = fondo.
const adaptiveBinarize = (gray: Uint8ClampedArray, width: number, height: number): Uint8Array => {
  const stride = width + 1
  const integral = new Float64Array(stride * (height + 1))
  for (let y = 0; y < height; y++) {
    let rowSum = 0
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x]
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum
    }
  }

  const half = Math.max(7, Math.round(Math.max(width, height) / 32))
  const ink = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - half)
    const y1 = Math.min(height - 1, y + half)
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - half)
      const x1 = Math.min(width - 1, x + half)
      const count = (x1 - x0 + 1) * (y1 - y0 + 1)
      const sum =
        integral[(y1 + 1) * stride + x1 + 1] -
        integral[y0 * stride + x1 + 1] -
        integral[(y1 + 1) * stride + x0] +
        integral[y0 * stride + x0]
      ink[y * width + x] = gray[y * width + x] * count < sum * 0.85 ? 1 : 0
    }
  }
  return ink
}

const DESKEW_SAMPLE_SIZE = 800
const DESKEW_MAX_ANGLE = 15
const DESKEW_MIN_ANGLE = 0.3

// Puntaje de un ángulo: proyecta la tinta sobre el eje vertical rotado. Con el
// texto horizontal, las líneas concentran la tinta en pocas filas (histograma
// "picudo", suma de cuadrados alta); con texto inclinado se reparte.
const skewScore = (xs: Float32Array, ys: Float32Array, angle: number, bins: number): number => {
  const rad = (angle * Math.PI) / 180
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)
  const histogram = new Float64Array(bins)
  const offset = bins / 2
  for (let i = 0; i < xs.length; i++) {
    const bin = Math.round(ys[i] * cos - xs[i] * sin + offset)
    if (bin >= 0 && bin < bins) histogram[bin]++
  }
  let score = 0
  for (let i = 0; i < bins; i++) score += histogram[i] * histogram[i]
  return score
}

/** Estima la inclinación del texto en grados (positivo = horario). 0 si no hay señal clara. */
const estimateSkew = (canvas: HTMLCanvasElement): number => {
  const scale = Math.min(1, DESKEW_SAMPLE_SIZE / Math.max(canvas.width, canvas.height))
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.round(canvas.width * scale))
  small.height = Math.max(1, Math.round(canvas.height * scale))
  const ctx = small.getContext('2d')
  if (!ctx) return 0
  ctx.drawImage(canvas, 0, 0, small.width, small.height)

  const gray = toGray(ctx.getImageData(0, 0, small.width, small.height))
  const ink = adaptiveBinarize(gray, small.width, small.height)

  const xs: number[] = []
  const ys: number[] = []
  for (let y = 0; y < small.height; y++) {
    for (let x = 0; x < small.width; x++) {
      if (ink[y * small.width + x]) {
        xs.push(x - small.width / 2)
        ys.push(y - small.height / 2)
      }
    }
  }
  if (xs.length < 200) return 0

  // Submuestreo para acotar el costo: ~20k puntos bastan para el histograma.
  const step = Math.max(1, Math.floor(xs.length / 20000))
  const px = new Float32Array(Math.ceil(xs.length / step))
  const py = new Float32Array(px.length)
  for (let i = 0, j = 0; i < xs.length; i += step, j++) {
    px[j] = xs[i]
    py[j] = ys[i]
  }

  const bins = Math.ceil(Math.hypot(small.width, small.height)) + 2
  const search = (from: number, to: number, stepDeg: number) => {
    let best = from
    let bestScore = -1
    for (let a = from; a <= to; a += stepDeg) {
      const score = skewScore(px, py, a, bins)
      if (score > bestScore) {
        bestScore = score
        best = a
      }
    }
    return best
  }

  const coarse = search(-DESKEW_MAX_ANGLE, DESKEW_MAX_ANGLE, 1)
  const fine = search(coarse - 1, coarse + 1, 0.1)
  return Math.abs(fine) < DESKEW_MIN_ANGLE ? 0 : fine
}

// Rota `degrees` (horario) ampliando el lienzo para no recortar y rellenando de blanco.
const rotateByAngle = (source: HTMLCanvasElement, degrees: number): HTMLCanvasElement => {
  const rad = (degrees * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(source.width * cos + source.height * sin)
  canvas.height = Math.ceil(source.width * sin + source.height * cos)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(source, -source.width / 2, -source.height / 2)
  return canvas
}

// Corrige la inclinación fina y deja la imagen en blanco/negro puro con umbral
// adaptativo, que es lo que mejor lee Tesseract en escaneos con sombras.
const enhanceForOcr = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const skew = estimateSkew(canvas)
  const straight = skew === 0 ? canvas : rotateByAngle(canvas, -skew)

  const ctx = straight.getContext('2d')
  if (!ctx) return straight

  const imageData = ctx.getImageData(0, 0, straight.width, straight.height)
  const ink = adaptiveBinarize(toGray(imageData), straight.width, straight.height)
  const { data } = imageData
  for (let p = 0, i = 0; p < ink.length; p++, i += 4) {
    data[i] = data[i + 1] = data[i + 2] = ink[p] ? 0 : 255
    data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  return straight
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
  return recognizeCanvasWithTesseract(worker, drawScaled(bitmap))
}

/** Igual que `recognizeWithTesseract` pero sobre un canvas ya dibujado (ej. página de PDF). */
export const recognizeCanvasWithTesseract = async (
  worker: Worker,
  scaled: HTMLCanvasElement,
): Promise<OcrResult> => {
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

/** Achica/comprime la imagen a data URL JPEG para que suba más rápido a los endpoints de IA. */
export const prepareImageForAi = async (file: File): Promise<string> => {
  try {
    const bitmap = await loadBitmap(file)
    return canvasToDataUrl(drawScaled(bitmap))
  } catch {
    return fileToDataUrl(file)
  }
}

/** OCR con IA vía `api/ai.ts` (Mistral con la key server-side; nunca llega al navegador). */
export const recognizeWithMistral = async (file: File): Promise<OcrResult> => ({
  text: await callAi({ task: 'ocr', image: await prepareImageForAi(file) }),
  confidence: 100,
})

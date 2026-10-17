import { createWorker, OEM, type Worker } from 'tesseract.js'
import { callAi } from './aiClient'

// Tesseract (local) aprovecha la resolución; los modelos de IA no ganan precisión pasado ~1600 px, solo tiempo de subida.
const MAX_DIMENSION = 2000
const AI_MAX_DIMENSION = 1600
const AI_JPEG_QUALITY = 0.8

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
// Tesseract y los modelos de IA no ganan precisión pasado cierto tamaño, solo tiempo.
const drawScaled = (bitmap: ImageBitmap, maxDimension = MAX_DIMENSION): HTMLCanvasElement => {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
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
  const integral = new Uint32Array(stride * (height + 1))
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

  // Suavizado previo: con fotos ruidosas el umbral marca "tinta" por todas partes y el ángulo sale falso.
  const gray = boxBlur3(toGray(ctx.getImageData(0, 0, small.width, small.height)), small.width, small.height)
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

// Tesseract rinde mejor cuando las letras miden ~20-35 px de alto: el texto chico se agranda.
const TARGET_LINE_HEIGHT = 32
const MAX_UPSCALE = 3
// Tope de píxeles de la imagen que se manda a Tesseract (memoria y tiempo acotados).
const MAX_OCR_PIXELS = 8_000_000
// Debajo de esta confianza se prueba también la versión en grises y se queda la mejor.
const RETRY_CONFIDENCE = 70

type Drawable = CanvasImageSource & { width: number; height: number }

const copyCanvas = (source: Drawable, scale = 1): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

// Fondo oscuro con letras claras (capturas en modo oscuro): se invierte para que la tinta quede oscura.
const isDarkBackground = (gray: Uint8ClampedArray): boolean => {
  const histogram = new Uint32Array(256)
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++
  let seen = 0
  for (let v = 0; v < 256; v++) {
    seen += histogram[v]
    if (seen >= gray.length / 2) return v < 110
  }
  return false
}

const grayOf = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const gray = toGray(imageData)
  if (isDarkBackground(gray)) for (let i = 0; i < gray.length; i++) gray[i] = 255 - gray[i]
  return { ctx, imageData, gray }
}

/** Altura típica (px) de las líneas de texto, por la proyección horizontal de la tinta. null si no hay señal. */
const estimateLineHeight = (canvas: HTMLCanvasElement): number | null => {
  const { gray } = grayOf(canvas)
  const { width, height } = canvas
  const ink = adaptiveBinarize(boxBlur3(gray, width, height), width, height)
  const minInk = Math.max(2, Math.round(width * 0.005))
  const runs: number[] = []
  let run = 0
  for (let y = 0; y <= height; y++) {
    let count = 0
    if (y < height) for (let x = 0; x < width; x++) count += ink[y * width + x]
    if (y < height && count >= minInk) run++
    else {
      if (run >= 3) runs.push(run)
      run = 0
    }
  }
  if (runs.length < 3) return null
  runs.sort((a, b) => a - b)
  return runs[Math.floor(runs.length / 2)]
}

// Endereza la inclinación fina (rellena de blanco lo que queda fuera).
const deskew = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const skew = estimateSkew(canvas)
  return skew === 0 ? canvas : rotateByAngle(canvas, -skew)
}

// Blanco y negro puro con umbral adaptativo: lo que mejor lee Tesseract en escaneos con sombras.
// Suavizado 3x3 (media): quita el grano de fotos con poca luz o JPEG muy comprimidos.
const boxBlur3 = (gray: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(gray.length)
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - 1)
    const y1 = Math.min(height - 1, y + 1)
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - 1)
      const x1 = Math.min(width - 1, x + 1)
      let sum = 0
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) sum += gray[yy * width + xx]
      out[y * width + x] = sum / ((x1 - x0 + 1) * (y1 - y0 + 1))
    }
  }
  return out
}

const binarized = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = copyCanvas(source)
  const { ctx, imageData, gray } = grayOf(canvas)
  const ink = adaptiveBinarize(gray, canvas.width, canvas.height)
  const { data } = imageData
  for (let p = 0, i = 0; p < ink.length; p++, i += 4) {
    data[i] = data[i + 1] = data[i + 2] = ink[p] ? 0 : 255
    data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// Grises con el contraste estirado (percentiles 1-99): conserva trazos finos que el umbral puede borrar.
const stretchedGray = (source: HTMLCanvasElement, smooth = false): HTMLCanvasElement => {
  const canvas = copyCanvas(source)
  const { ctx, imageData, gray: raw } = grayOf(canvas)
  const gray = smooth ? boxBlur3(raw, canvas.width, canvas.height) : raw
  const histogram = new Uint32Array(256)
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++
  const percentile = (q: number) => {
    let seen = 0
    for (let v = 0; v < 256; v++) {
      seen += histogram[v]
      if (seen >= gray.length * q) return v
    }
    return 255
  }
  const low = percentile(0.01)
  const high = Math.max(low + 1, percentile(0.99))
  const { data } = imageData
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.round(((gray[p] - low) * 255) / (high - low))
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, v))
    data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/** Limpia la salida de Tesseract: espacios al final, palabras cortadas con guion al final de línea y saltos repetidos. */
export const cleanOcrText = (text: string): string =>
  text
    .replace(/\r/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/(\p{Ll})-\n(\p{Ll})/gu, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

// `legacyCore`/`legacyLang` habilitan worker.detect() (OSD), que usa el motor
// legacy de Tesseract solo para detectar orientación — no afecta la precisión
// del reconocimiento final, que sigue corriendo en LSTM (OEM.LSTM_ONLY).
export const createOcrWorker = async (): Promise<Worker> => {
  const worker = await createWorker('spa+eng', OEM.LSTM_ONLY, { legacyCore: true, legacyLang: true })
  // DPI explícito (las imágenes no lo traen) y espacios entre palabras respetados (tablas, facturas).
  await worker.setParameters({ user_defined_dpi: '300', preserve_interword_spaces: '1' })
  return worker
}

const recognizeSource = async (worker: Worker, source: Drawable): Promise<OcrResult> => {
  const previewScale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height))
  const preview = copyCanvas(source, previewScale)

  let rotation: 0 | 90 | 180 | 270 = 0
  try {
    const { data } = await worker.detect(preview)
    if (data.orientation_degrees) rotation = normalizeRotation(data.orientation_degrees)
  } catch {
    // Si el detect falla, seguimos sin rotar en vez de cortar la conversión.
  }

  // Solo se agranda (nunca por debajo de la vista previa) y sin pasar el tope de píxeles.
  let work = rotateCanvas(preview, rotation)
  const lineHeight = estimateLineHeight(work)
  if (lineHeight && lineHeight < TARGET_LINE_HEIGHT * 0.75) {
    const wanted = previewScale * Math.min(MAX_UPSCALE, TARGET_LINE_HEIGHT / lineHeight)
    const scale = Math.min(wanted, Math.sqrt(MAX_OCR_PIXELS / (source.width * source.height)))
    if (scale > previewScale * 1.1) work = rotateCanvas(copyCanvas(source, scale), rotation)
  }

  // Primero blanco y negro; si la confianza sale baja, se prueban versiones alternativas
  // (grises suavizados contra el ruido, que binarizado se vuelve manchas, y grises sin suavizar) y se queda la de mayor confianza.
  const straight = deskew(work)
  const variants = [() => binarized(straight), () => stretchedGray(straight, true), () => stretchedGray(straight)]
  let best = { text: '', confidence: -1 }
  for (const variant of variants) {
    const { data } = await worker.recognize(variant())
    if (data.text.trim() && data.confidence > best.confidence) best = { text: data.text, confidence: data.confidence }
    if (best.confidence >= RETRY_CONFIDENCE) break
  }
  return { text: cleanOcrText(best.text), confidence: Math.max(0, best.confidence) }
}

/**
 * Detecta la orientación con OSD, agranda el texto chico, endereza la inclinación y reconoce sobre
 * la imagen binarizada. Si la confianza sale baja, prueba también en grises y se queda con la mejor.
 */
export const recognizeWithTesseract = async (worker: Worker, file: File): Promise<OcrResult> =>
  recognizeSource(worker, await loadBitmap(file))

/** Igual que `recognizeWithTesseract` pero sobre un canvas ya dibujado (ej. página de PDF). */
export const recognizeCanvasWithTesseract = (worker: Worker, canvas: HTMLCanvasElement): Promise<OcrResult> =>
  recognizeSource(worker, canvas)

const canvasToDataUrl = (canvas: HTMLCanvasElement, quality = 0.85): string =>
  canvas.toDataURL('image/jpeg', quality)

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
    return canvasToDataUrl(drawScaled(bitmap, AI_MAX_DIMENSION), AI_JPEG_QUALITY)
  } catch {
    return fileToDataUrl(file)
  }
}

/** OCR con IA vía `api/ai.ts` (proveedor configurado por variables de entorno; la key nunca llega al navegador). */
export const recognizeWithAi = async (file: File): Promise<OcrResult> => ({
  text: await callAi({ task: 'ocr', image: await prepareImageForAi(file) }),
  confidence: 100,
})

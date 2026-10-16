export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}

export const FORMAT_EXT: Record<ImageFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const canvasToBlob = (canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))),
      format,
      format === 'image/png' ? undefined : quality,
    )
  })

const drawToCanvas = (bitmap: ImageBitmap, format: ImageFormat, scale: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  // JPG no soporta transparencia — fondo blanco para que no quede negro.
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

export const convertImage = async (
  file: File,
  format: ImageFormat,
  quality: number,
): Promise<{ blob: Blob; previewUrl: string }> => {
  const bitmap = await createImageBitmap(file)
  const blob = await canvasToBlob(drawToCanvas(bitmap, format, 1), format, quality / 100)
  return { blob, previewUrl: URL.createObjectURL(blob) }
}

const MIN_QUALITY = 0.1
const QUALITY_STEPS = 7
const SCALE_FACTOR = 0.85
const MIN_SCALE = 0.1

/**
 * Comprime hasta que pese como máximo `maxBytes`: busca la mayor calidad que lo logre y, si ni con la
 * calidad mínima alcanza, reduce las dimensiones y vuelve a intentar. Solo JPG y WebP (PNG no tiene calidad).
 */
export const compressToTarget = async (
  file: File,
  format: Exclude<ImageFormat, 'image/png'>,
  maxBytes: number,
): Promise<{ blob: Blob; previewUrl: string }> => {
  const bitmap = await createImageBitmap(file)

  for (let scale = 1; scale >= MIN_SCALE; scale *= SCALE_FACTOR) {
    const canvas = drawToCanvas(bitmap, format, scale)
    const lowest = await canvasToBlob(canvas, format, MIN_QUALITY)
    if (lowest.size > maxBytes) continue

    // Búsqueda binaria de la mayor calidad que cabe en el peso máximo.
    let best = lowest
    let low = MIN_QUALITY
    let high = 1
    for (let i = 0; i < QUALITY_STEPS; i++) {
      const mid = (low + high) / 2
      const blob = await canvasToBlob(canvas, format, mid)
      if (blob.size <= maxBytes) {
        best = blob
        low = mid
      } else {
        high = mid
      }
    }
    return { blob: best, previewUrl: URL.createObjectURL(best) }
  }

  throw new Error('No se pudo llegar a ese peso. Prueba con un valor mayor.')
}

import jsQR from 'jsqr'

// Lado máximo de cada intento: jsQR es lento y falla con fotos enormes; un QR chico se pierde si se achica mucho.
const SCALES = [1000, 1600, 600, 2400]
// Margen blanco que se agrega alrededor: un QR recortado justo al borde no se detecta sin "zona de silencio".
const QUIET_ZONE = 0.08

type BarcodeDetectorLike = { detect: (source: ImageBitmap) => Promise<{ rawValue: string }[]> }
type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike

// Lector nativo del navegador (Chrome en Android, macOS y ChromeOS): más tolerante a fotos torcidas o borrosas.
const detectNative = async (bitmap: ImageBitmap): Promise<string | null> => {
  const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  if (!Detector) return null
  try {
    const codes = await new Detector({ formats: ['qr_code'] }).detect(bitmap)
    return codes.find((c) => c.rawValue)?.rawValue ?? null
  } catch {
    return null
  }
}

const decodeAt = (bitmap: ImageBitmap, maxSide: number): string | null => {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const pad = Math.round(Math.max(width, height) * QUIET_ZONE)

  const canvas = document.createElement('canvas')
  canvas.width = width + pad * 2
  canvas.height = height + pad * 2
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, pad, pad, width, height)

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  // attemptBoth: también lee QR claros sobre fondo oscuro.
  return jsQR(data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' })?.data || null
}

/** Lee un código QR de una imagen. Prueba el lector nativo y luego jsQR a varias escalas. null si no hay QR. */
export const decodeQrFromFile = async (file: File): Promise<string | null> => {
  const bitmap = await createImageBitmap(file)
  try {
    const native = await detectNative(bitmap)
    if (native) return native
    const sides = [...new Set(SCALES.map((s) => Math.min(s, Math.max(bitmap.width, bitmap.height))))]
    for (const side of sides) {
      const result = decodeAt(bitmap, side)
      if (result) return result
    }
    return null
  } finally {
    bitmap.close()
  }
}

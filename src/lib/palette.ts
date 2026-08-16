const BUCKET_SIZE = 32
const MAX_DIMENSION = 150

const toHex = (n: number) => n.toString(16).padStart(2, '0')

export type PaletteColor = {
  hex: string
  rgb: [number, number, number]
  percentage: number
}

const drawScaled = (bitmap: ImageBitmap, maxDimension: number) => {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export const extractPalette = async (file: File, count = 6): Promise<PaletteColor[]> => {
  const bitmap = await createImageBitmap(file)
  const { data } = drawScaled(bitmap, MAX_DIMENSION)

  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>()
  let totalSampled = 0

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = `${Math.floor(r / BUCKET_SIZE)}-${Math.floor(g / BUCKET_SIZE)}-${Math.floor(b / BUCKET_SIZE)}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.count += 1
    } else {
      buckets.set(key, { r, g, b, count: 1 })
    }
    totalSampled += 1
  }

  if (totalSampled === 0) return []

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count)
      const g = Math.round(bucket.g / bucket.count)
      const b = Math.round(bucket.b / bucket.count)
      return {
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        rgb: [r, g, b],
        percentage: Math.round((bucket.count / totalSampled) * 100),
      }
    })
}

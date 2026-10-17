const MAX_DIMENSION = 150
const ITERATIONS = 12
// Dos colores a menos de esta distancia en Lab (ΔE) se ven casi iguales y se fusionan.
const MERGE_DELTA_E = 10

const toHex = (n: number) => n.toString(16).padStart(2, '0')

export type PaletteColor = {
  hex: string
  rgb: [number, number, number]
  percentage: number
}

type Lab = [number, number, number]

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

// sRGB → CIELAB (D65): la distancia en Lab se parece a la diferencia que percibe el ojo, a diferencia de RGB.
const toLinear = (c: number) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const labF = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)

const rgbToLab = (r: number, g: number, b: number): Lab => {
  const R = toLinear(r)
  const G = toLinear(g)
  const B = toLinear(b)
  const x = labF((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047)
  const y = labF(R * 0.2126 + G * 0.7152 + B * 0.0722)
  const z = labF((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

const distance2 = (a: Lab, b: Lab) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

type Cluster = { lab: Lab; r: number; g: number; b: number; count: number }

/**
 * Colores dominantes con k-means en espacio Lab. Las semillas salen de los tonos más frecuentes (resultado
 * estable para la misma imagen) y al final se fusionan los grupos casi idénticos.
 */
export const extractPalette = async (file: File, count = 6): Promise<PaletteColor[]> => {
  const bitmap = await createImageBitmap(file)
  const { data } = drawScaled(bitmap, MAX_DIMENSION)
  bitmap.close()

  const pixels: { lab: Lab; r: number; g: number; b: number }[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    pixels.push({ lab: rgbToLab(data[i], data[i + 1], data[i + 2]), r: data[i], g: data[i + 1], b: data[i + 2] })
  }
  if (pixels.length === 0) return []

  // Semillas: los tonos más frecuentes en un histograma grueso, separados entre sí.
  const histogram = new Map<string, { lab: Lab; count: number }>()
  for (const p of pixels) {
    const key = `${p.r >> 4}-${p.g >> 4}-${p.b >> 4}`
    const entry = histogram.get(key)
    if (entry) entry.count++
    else histogram.set(key, { lab: p.lab, count: 1 })
  }
  const k = Math.min(count * 2, histogram.size)
  const seeds: Lab[] = []
  for (const { lab } of [...histogram.values()].sort((a, b) => b.count - a.count)) {
    if (seeds.every((s) => distance2(s, lab) > MERGE_DELTA_E ** 2)) seeds.push(lab)
    if (seeds.length === k) break
  }

  let centers = seeds
  const assignment = new Uint16Array(pixels.length)
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let best = 0
      let bestD = Infinity
      for (let c = 0; c < centers.length; c++) {
        const d = distance2(pixels[i].lab, centers[c])
        if (d < bestD) {
          bestD = d
          best = c
        }
      }
      assignment[i] = best
    }
    const sums = centers.map(() => [0, 0, 0, 0])
    for (let i = 0; i < pixels.length; i++) {
      const s = sums[assignment[i]]
      s[0] += pixels[i].lab[0]
      s[1] += pixels[i].lab[1]
      s[2] += pixels[i].lab[2]
      s[3]++
    }
    centers = sums.map((s, c) => (s[3] ? ([s[0] / s[3], s[1] / s[3], s[2] / s[3]] as Lab) : centers[c]))
  }

  const clusters: Cluster[] = centers.map((lab) => ({ lab, r: 0, g: 0, b: 0, count: 0 }))
  for (let i = 0; i < pixels.length; i++) {
    const c = clusters[assignment[i]]
    c.r += pixels[i].r
    c.g += pixels[i].g
    c.b += pixels[i].b
    c.count++
  }

  // Fusiona grupos casi idénticos (el más grande absorbe al más chico).
  const merged: Cluster[] = []
  for (const c of clusters.filter((c) => c.count > 0).sort((a, b) => b.count - a.count)) {
    const twin = merged.find((m) => distance2(m.lab, c.lab) < MERGE_DELTA_E ** 2)
    if (twin) {
      twin.r += c.r
      twin.g += c.g
      twin.b += c.b
      twin.count += c.count
    } else merged.push({ ...c })
  }

  return merged
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((c) => {
      const r = Math.round(c.r / c.count)
      const g = Math.round(c.g / c.count)
      const b = Math.round(c.b / c.count)
      return {
        hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
        rgb: [r, g, b],
        percentage: Math.round((c.count / pixels.length) * 100),
      }
    })
}

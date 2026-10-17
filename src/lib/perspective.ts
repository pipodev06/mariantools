// Corrección de perspectiva para "escanear" un documento fotografiado: lleva el cuadrilátero de la hoja
// a un rectángulo. Homografía de 4 puntos + muestreo bilineal, todo en el navegador.

export type Point = { x: number; y: number }
/** Matriz 3x3 en orden por filas, con h[8] = 1. */
export type Homography = number[]

// Resuelve A·x = b (8x8) por eliminación gaussiana con pivoteo parcial.
const solve = (a: number[][], b: number[]): number[] => {
  const n = b.length
  const m = a.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r
    if (Math.abs(m[pivot][col]) < 1e-12) throw new Error('Las esquinas no forman un cuadrilátero válido')
    ;[m[col], m[pivot]] = [m[pivot], m[col]]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = m[r][col] / m[col][col]
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c]
    }
  }
  return m.map((row, i) => row[n] / row[i])
}

/** Homografía que lleva cada punto de `from` a su par en `to` (4 pares). */
export const computeHomography = (from: Point[], to: Point[]): Homography => {
  const a: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i]
    const { x: u, y: v } = to[i]
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  return [...solve(a, b), 1]
}

export const applyHomography = (h: Homography, { x, y }: Point): Point => {
  const w = h[6] * x + h[7] * y + h[8]
  return { x: (h[0] * x + h[1] * y + h[2]) / w, y: (h[3] * x + h[4] * y + h[5]) / w }
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/** Tamaño del rectángulo de salida: el lado más largo de cada par opuesto, con tope de píxeles. */
export const outputSize = ([tl, tr, br, bl]: Point[], maxSide = 2400) => {
  const width = Math.max(distance(tl, tr), distance(bl, br))
  const height = Math.max(distance(tl, bl), distance(tr, br))
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Endereza el cuadrilátero [arriba-izq, arriba-der, abajo-der, abajo-izq] de `source` a un rectángulo.
 * Mapeo inverso: para cada píxel de salida se busca su origen y se interpola entre los 4 vecinos.
 */
export const warpPerspective = (source: HTMLCanvasElement, corners: Point[]): HTMLCanvasElement => {
  const { width, height } = outputSize(corners)
  const rect = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: width - 1, y: height - 1 },
    { x: 0, y: height - 1 },
  ]
  const inverse = computeHomography(rect, corners)

  const srcCtx = source.getContext('2d', { willReadFrequently: true })
  if (!srcCtx) throw new Error('No se pudo crear el contexto de canvas')
  const src = srcCtx.getImageData(0, 0, source.width, source.height).data
  const sw = source.width
  const sh = source.height

  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const outCtx = out.getContext('2d')
  if (!outCtx) throw new Error('No se pudo crear el contexto de canvas')
  const image = outCtx.createImageData(width, height)
  const dst = image.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = applyHomography(inverse, { x, y })
      const x0 = Math.max(0, Math.min(sw - 1, Math.floor(p.x)))
      const y0 = Math.max(0, Math.min(sh - 1, Math.floor(p.y)))
      const x1 = Math.min(sw - 1, x0 + 1)
      const y1 = Math.min(sh - 1, y0 + 1)
      const fx = Math.max(0, Math.min(1, p.x - x0))
      const fy = Math.max(0, Math.min(1, p.y - y0))
      const o = (y * width + x) * 4
      for (let c = 0; c < 3; c++) {
        const a = src[(y0 * sw + x0) * 4 + c]
        const b = src[(y0 * sw + x1) * 4 + c]
        const d = src[(y1 * sw + x0) * 4 + c]
        const e = src[(y1 * sw + x1) * 4 + c]
        dst[o + c] = (a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy
      }
      dst[o + 3] = 255
    }
  }
  outCtx.putImageData(image, 0, 0)
  return out
}

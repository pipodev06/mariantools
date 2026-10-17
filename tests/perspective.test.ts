import { describe, expect, it } from 'vitest'
import { applyHomography, computeHomography, outputSize } from '../src/lib/perspective'

const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 6)
  expect(a.y).toBeCloseTo(b.y, 6)
}

describe('homografía', () => {
  const foto = [
    { x: 120, y: 80 },
    { x: 900, y: 140 },
    { x: 860, y: 1180 },
    { x: 60, y: 1100 },
  ]
  const rect = [
    { x: 0, y: 0 },
    { x: 799, y: 0 },
    { x: 799, y: 1099 },
    { x: 0, y: 1099 },
  ]

  it('lleva cada esquina de la foto a la esquina del rectángulo', () => {
    const h = computeHomography(foto, rect)
    foto.forEach((p, i) => close(applyHomography(h, p), rect[i]))
  })

  it('la inversa deshace la transformación', () => {
    const h = computeHomography(foto, rect)
    const inv = computeHomography(rect, foto)
    const p = { x: 400, y: 600 }
    close(applyHomography(inv, applyHomography(h, p)), p)
  })

  it('rechaza esquinas alineadas (no forman un cuadrilátero)', () => {
    const linea = [0, 1, 2, 3].map((i) => ({ x: i * 10, y: i * 10 }))
    expect(() => computeHomography(linea, rect)).toThrow()
  })
})

describe('outputSize', () => {
  it('usa el lado más largo de cada par opuesto', () => {
    const size = outputSize([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 110, y: 200 },
      { x: 0, y: 190 },
    ])
    expect(size.width).toBe(110)
    expect(size.height).toBe(200)
  })

  it('respeta el tope de píxeles manteniendo la proporción', () => {
    const size = outputSize(
      [
        { x: 0, y: 0 },
        { x: 4000, y: 0 },
        { x: 4000, y: 2000 },
        { x: 0, y: 2000 },
      ],
      1000,
    )
    expect(size).toEqual({ width: 1000, height: 500 })
  })
})

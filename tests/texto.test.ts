import { describe, expect, it } from 'vitest'
import { joinTextItems } from '../src/lib/pdfTextLayer'
import { textStats } from '../src/lib/textStats'

describe('textStats', () => {
  it('cuenta palabras, oraciones y párrafos', () => {
    const s = textStats('Hola mundo. ¿Cómo estás?\n\nBien, gracias.')
    expect(s.palabras).toBe(6)
    expect(s.oraciones).toBe(3)
    expect(s.parrafos).toBe(2)
  })

  it('caracteres con y sin espacios; un emoji cuenta como uno', () => {
    const s = textStats('a b 👍')
    expect(s.caracteres).toBe(5)
    expect(s.caracteresSinEspacios).toBe(3)
  })

  it('palabras con guion o apóstrofo cuentan como una', () => {
    expect(textStats('bien-estar l’amour').palabras).toBe(2)
  })

  it('texto vacío', () => {
    expect(textStats('   ')).toMatchObject({ palabras: 0, oraciones: 0, parrafos: 0, minutosLectura: 0 })
  })

  it('tiempo de lectura redondeado hacia arriba (200 ppm)', () => {
    expect(textStats('palabra '.repeat(201)).minutosLectura).toBe(2)
  })
})

describe('joinTextItems (capa de texto de PDF)', () => {
  const item = (str: string, x: number, y: number, width: number, hasEOL = false) => ({
    str,
    transform: [10, 0, 0, 10, x, y],
    width,
    height: 10,
    hasEOL,
  })

  it('une letras sueltas sin espacios y separa palabras por el hueco', () => {
    const letras = [item('H', 0, 100, 6), item('o', 6, 100, 6), item('l', 12, 100, 3), item('a', 15, 100, 6), item('m', 26, 100, 9), item('u', 35, 100, 6)]
    expect(joinTextItems(letras)).toBe('Hola mu')
  })

  it('salta de línea cuando cambia el renglón o hay fin de línea', () => {
    expect(joinTextItems([item('Total:', 0, 50, 30), item('S/ 10', 35, 50, 25, true), item('Gracias', 0, 35, 40)])).toBe(
      'Total: S/ 10\nGracias',
    )
    expect(joinTextItems([item('Uno', 0, 50, 20), item('Dos', 0, 30, 20)])).toBe('Uno\nDos')
  })
})

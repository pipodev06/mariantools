import { describe, expect, it } from 'vitest'
import { code128SymbolWidths, ean13CheckDigit, encodeCode128, encodeEan13 } from '../src/lib/barcode'

describe('EAN-13', () => {
  it('calcula el dígito verificador de códigos reales', () => {
    expect(ean13CheckDigit('400638133393')).toBe(1)
    expect(ean13CheckDigit('590123412345')).toBe(7)
  })

  it('genera 95 módulos con guardas de inicio, centro y fin', () => {
    const { bits, text } = encodeEan13('400638133393')
    expect(text).toBe('4006381333931')
    expect(bits).toHaveLength(95)
    expect(bits.slice(0, 3)).toBe('101')
    expect(bits.slice(45, 50)).toBe('01010')
    expect(bits.slice(-3)).toBe('101')
  })

  it('acepta 13 dígitos correctos y rechaza un verificador equivocado', () => {
    expect(encodeEan13('5901234123457').text).toBe('5901234123457')
    expect(() => encodeEan13('5901234123458')).toThrow(/debería ser 7/)
    expect(() => encodeEan13('12345')).toThrow()
  })
})

describe('Code 128', () => {
  it('la tabla tiene 107 símbolos distintos de 11 módulos (parada de 13)', () => {
    const widths = code128SymbolWidths()
    expect(widths).toHaveLength(107)
    expect(widths.slice(0, 106).every((w) => w === 11)).toBe(true)
    expect(widths[106]).toBe(13)
  })

  it('largo = (inicio + caracteres + verificador) x 11 + parada', () => {
    expect(encodeCode128('ABC').bits).toHaveLength((1 + 3 + 1) * 11 + 13)
  })

  it('empieza con Start B y termina con la parada', () => {
    const { bits } = encodeCode128('Hola 123')
    expect(bits.startsWith('11010010000')).toBe(true) // Start B = 211214
    expect(bits.endsWith('1100011101011')).toBe(true) // Stop = 2331112
  })

  it('rechaza caracteres fuera de ASCII y texto vacío', () => {
    expect(() => encodeCode128('año')).toThrow(/ñ/)
    expect(() => encodeCode128('')).toThrow()
  })
})

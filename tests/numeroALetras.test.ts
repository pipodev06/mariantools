import { describe, expect, it } from 'vitest'
import { enteroALetras, montoEnLetras } from '../src/lib/numeroALetras'

describe('enteroALetras', () => {
  it.each([
    [0, 'cero'],
    [1, 'uno'],
    [15, 'quince'],
    [16, 'dieciséis'],
    [21, 'veintiuno'],
    [22, 'veintidós'],
    [30, 'treinta'],
    [31, 'treinta y uno'],
    [100, 'cien'],
    [101, 'ciento uno'],
    [115, 'ciento quince'],
    [500, 'quinientos'],
    [999, 'novecientos noventa y nueve'],
    [1000, 'mil'],
    [1001, 'mil uno'],
    [2000, 'dos mil'],
    [21000, 'veintiún mil'],
    [31000, 'treinta y un mil'],
    [100000, 'cien mil'],
    [101000, 'ciento un mil'],
    [1_000_000, 'un millón'],
    [2_500_000, 'dos millones quinientos mil'],
    [21_000_000, 'veintiún millones'],
    [1_000_000_000, 'mil millones'],
    [1_001_000_000, 'mil un millones'],
  ])('%i → %s', (n, texto) => {
    expect(enteroALetras(n)).toBe(texto)
  })

  it('rechaza negativos, decimales y montos fuera de rango', () => {
    expect(() => enteroALetras(-1)).toThrow()
    expect(() => enteroALetras(1.5)).toThrow()
    expect(() => enteroALetras(1e12)).toThrow()
  })
})

describe('montoEnLetras', () => {
  it('formato de factura en soles', () => {
    expect(montoEnLetras(1234.5)).toBe('MIL DOSCIENTOS TREINTA Y CUATRO CON 50/100 SOLES')
  })

  it('dólares y sin moneda', () => {
    expect(montoEnLetras(21, 'dolares')).toBe('VEINTIUNO CON 00/100 DÓLARES AMERICANOS')
    expect(montoEnLetras(7.05, 'ninguna')).toBe('SIETE CON 05/100')
  })

  it('redondea los céntimos', () => {
    expect(montoEnLetras(0.999)).toBe('UNO CON 00/100 SOLES')
    expect(montoEnLetras(10.005)).toMatch(/^DIEZ CON 0[01]\/100 SOLES$/)
  })
})

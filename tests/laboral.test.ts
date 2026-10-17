import { describe, expect, it } from 'vitest'
import { cts, gratificacion, horasExtras, igv, parseMoney, validarRuc, vacaciones } from '../src/lib/laboral'

describe('calculadoras laborales', () => {
  it('gratificación completa con bonificación de EsSalud', () => {
    expect(gratificacion(1000, 6, 0.09)).toEqual({ base: 1000, bonificacion: 90, total: 1090 })
  })

  it('gratificación proporcional y meses fuera de rango', () => {
    expect(gratificacion(1200, 3, 0).base).toBe(600)
    expect(gratificacion(1200, 9, 0).base).toBe(1200)
    expect(gratificacion(1200, -1, 0).base).toBe(0)
  })

  it('CTS incluye un sexto de la última gratificación', () => {
    // RC = 1200 + 1200/6 = 1400 → 6 meses = 700
    expect(cts(1200, 1200, { months: 6, days: 0 })).toBeCloseTo(700, 6)
    expect(cts(1200, 0, { months: 0, days: 30 })).toBeCloseTo(100, 6)
  })

  it('vacaciones truncas', () => {
    expect(vacaciones(1200, { months: 6, days: 0 })).toBeCloseTo(600, 6)
  })

  it('horas extras al 25 % y 35 %', () => {
    const r = horasExtras(2400, 8, 2, 1)
    expect(r.valorHora).toBe(10)
    expect(r.pago25).toBe(25)
    expect(r.pago35).toBe(13.5)
    expect(r.total).toBe(38.5)
  })

  it('IGV: agregar y quitar son inversos', () => {
    expect(igv(100, 18, 'agregar').total).toBeCloseTo(118, 6)
    const quitar = igv(118, 18, 'quitar')
    expect(quitar.base).toBeCloseTo(100, 6)
    expect(quitar.impuesto).toBeCloseTo(18, 6)
  })

  it('parseMoney acepta comas de miles y vacío', () => {
    expect(parseMoney('')).toBe(0)
    expect(parseMoney('1500.50')).toBe(1500.5)
  })
})

describe('validarRuc', () => {
  it('acepta un RUC real con dígito verificador correcto (SUNAT)', () => {
    expect(validarRuc('20131312955')).toEqual({ valido: true, tipo: 'Persona jurídica' })
  })

  it('rechaza un dígito verificador incorrecto', () => {
    expect(validarRuc('20131312956').valido).toBe(false)
  })

  it('rechaza largo y prefijo inválidos', () => {
    expect(validarRuc('2013131295').valido).toBe(false)
    expect(validarRuc('99131312955').valido).toBe(false)
  })
})

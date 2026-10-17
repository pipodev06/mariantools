import { describe, expect, it } from 'vitest'
import { BONIF_EPS } from '../src/lib/laboral'
import { AFP_TOPE_PRIMA, UIT, impuestoProgresivo, rentaQuinta, sueldoNeto } from '../src/lib/planilla'

describe('impuestoProgresivo (escala de quinta)', () => {
  it('8 % hasta 5 UIT', () => {
    expect(impuestoProgresivo(5 * UIT)).toBe(2200)
  })

  it('suma los tramos hasta 20 UIT', () => {
    // 5 UIT al 8 % + 15 UIT al 14 %
    expect(impuestoProgresivo(20 * UIT)).toBe(2200 + 11550)
  })

  it('aplica 30 % por encima de 45 UIT', () => {
    const hasta45 = 5 * UIT * 0.08 + 15 * UIT * 0.14 + 15 * UIT * 0.17 + 10 * UIT * 0.2
    expect(impuestoProgresivo(46 * UIT)).toBeCloseTo(hasta45 + UIT * 0.3, 2)
  })

  it('0 sin renta neta', () => {
    expect(impuestoProgresivo(0)).toBe(0)
  })
})

describe('rentaQuinta', () => {
  it('sueldo de S/ 3 000 con EsSalud', () => {
    const r = rentaQuinta({ sueldo: 3000 })
    expect(r.brutaAnual).toBe(36000 + 6000 * 1.09)
    expect(r.deduccion).toBe(7 * UIT)
    expect(r.netaAnual).toBe(4040)
    expect(r.impuestoAnual).toBe(323.2)
    expect(r.retencionMensual).toBe(26.93)
  })

  it('no paga si no supera 7 UIT', () => {
    expect(rentaQuinta({ sueldo: 2000 }).impuestoAnual).toBe(0)
  })

  it('EPS usa la bonificación de 6.75 % y suma otros ingresos', () => {
    const r = rentaQuinta({ sueldo: 3000, tasaBonificacion: BONIF_EPS, otrosAnuales: 1000 })
    expect(r.brutaAnual).toBe(36000 + 6000 * 1.0675 + 1000)
  })
})

describe('sueldoNeto', () => {
  it('ONP descuenta 13 % y la quinta', () => {
    const r = sueldoNeto({ sueldo: 3000, sistema: 'onp' })
    expect(r.aporte).toBe(390)
    expect(r.primaSeguro).toBe(0)
    expect(r.comision).toBe(0)
    expect(r.quinta).toBe(26.93)
    expect(r.neto).toBe(2583.07)
  })

  it('AFP Integra con comisión sobre el sueldo', () => {
    const r = sueldoNeto({ sueldo: 3000, sistema: 'afp', afp: 'integra', comision: 'flujo' })
    expect(r.aporte).toBe(300)
    expect(r.primaSeguro).toBe(41.1)
    expect(r.comision).toBe(46.5)
    expect(r.pension).toBe(387.6)
  })

  it('comisión mixta no se descuenta del sueldo', () => {
    expect(sueldoNeto({ sueldo: 3000, sistema: 'afp', comision: 'mixta' }).comision).toBe(0)
  })

  it('la prima de seguro se topa en la remuneración máxima asegurable', () => {
    const r = sueldoNeto({ sueldo: 20000, sistema: 'afp' })
    expect(r.primaSeguro).toBeCloseTo(AFP_TOPE_PRIMA * 0.0137, 2)
  })
})

// Sueldo neto y renta de quinta categoría (Perú, régimen general). Valores oficiales vigentes en 2026;
// revisarlos cada año: UIT (D.S. 301-2025-EF) y tasas del SPP publicadas por la SBS.
import { BONIF_ESSALUD } from './laboral'

export const UIT = 5500
export const ONP_TASA = 0.13
export const AFP_APORTE = 0.1
export const AFP_PRIMA_SEGURO = 0.0137
/** Remuneración máxima asegurable: la prima de seguro no se cobra sobre lo que la excede. */
export const AFP_TOPE_PRIMA = 12672.65

export const AFPS = [
  { value: 'habitat', label: 'AFP Habitat', comisionFlujo: 0.0147 },
  { value: 'integra', label: 'AFP Integra', comisionFlujo: 0.0155 },
  { value: 'prima', label: 'Prima AFP', comisionFlujo: 0.016 },
  { value: 'profuturo', label: 'Profuturo AFP', comisionFlujo: 0.0169 },
] as const

export type AfpId = (typeof AFPS)[number]['value']

/** Tramos del impuesto: límite superior en UIT y tasa. */
export const ESCALA_QUINTA: readonly [number, number][] = [
  [5, 0.08],
  [20, 0.14],
  [35, 0.17],
  [45, 0.2],
  [Infinity, 0.3],
]

const round2 = (n: number) => Math.round(n * 100) / 100

/** Impuesto anual sobre la renta neta (después de deducir las 7 UIT), con la escala progresiva. */
export const impuestoProgresivo = (rentaNeta: number, uit = UIT): number => {
  let impuesto = 0
  let desde = 0
  for (const [hasta, tasa] of ESCALA_QUINTA) {
    const tope = hasta * uit
    if (rentaNeta <= desde) break
    impuesto += (Math.min(rentaNeta, tope) - desde) * tasa
    desde = tope
  }
  return round2(impuesto)
}

export type RentaQuintaInput = {
  sueldo: number
  /** Otros ingresos afectos del año (bonos, utilidades, horas extras). */
  otrosAnuales?: number
  /** Bonificación extraordinaria sobre las gratificaciones: 9 % EsSalud o 6.75 % EPS. */
  tasaBonificacion?: number
  uit?: number
}

export type RentaQuinta = {
  brutaAnual: number
  deduccion: number
  netaAnual: number
  impuestoAnual: number
  retencionMensual: number
}

/**
 * Proyección anual: 12 sueldos + 2 gratificaciones (con su bonificación extraordinaria) + otros ingresos,
 * menos 7 UIT. La retención mensual es el impuesto anual entre 12 (aproximación del método de SUNAT,
 * que reparte la retención de forma escalonada a lo largo del año).
 */
export const rentaQuinta = ({ sueldo, otrosAnuales = 0, tasaBonificacion = BONIF_ESSALUD, uit = UIT }: RentaQuintaInput): RentaQuinta => {
  const brutaAnual = round2(sueldo * 12 + sueldo * 2 * (1 + tasaBonificacion) + otrosAnuales)
  const deduccion = 7 * uit
  const netaAnual = Math.max(0, round2(brutaAnual - deduccion))
  const impuestoAnual = impuestoProgresivo(netaAnual, uit)
  return { brutaAnual, deduccion, netaAnual, impuestoAnual, retencionMensual: round2(impuestoAnual / 12) }
}

export type SueldoNetoInput = {
  sueldo: number
  sistema: 'onp' | 'afp'
  afp?: AfpId
  /** Comisión sobre el sueldo (flujo) o mixta (sobre el saldo acumulado, no se descuenta del sueldo). */
  comision?: 'flujo' | 'mixta'
  tasaBonificacion?: number
  uit?: number
}

export type SueldoNeto = {
  aporte: number
  primaSeguro: number
  comision: number
  pension: number
  quinta: number
  neto: number
}

/** Sueldo neto mensual: bruto menos el descuento de pensiones (ONP o AFP) y la retención de quinta. */
export const sueldoNeto = ({ sueldo, sistema, afp = 'integra', comision = 'flujo', tasaBonificacion, uit }: SueldoNetoInput): SueldoNeto => {
  let aporte = round2(sueldo * ONP_TASA)
  let primaSeguro = 0
  let comisionMonto = 0
  if (sistema === 'afp') {
    const datos = AFPS.find((a) => a.value === afp) ?? AFPS[1]
    aporte = round2(sueldo * AFP_APORTE)
    primaSeguro = round2(Math.min(sueldo, AFP_TOPE_PRIMA) * AFP_PRIMA_SEGURO)
    comisionMonto = comision === 'flujo' ? round2(sueldo * datos.comisionFlujo) : 0
  }
  const pension = round2(aporte + primaSeguro + comisionMonto)
  const quinta = rentaQuinta({ sueldo, tasaBonificacion, uit }).retencionMensual
  return { aporte, primaSeguro, comision: comisionMonto, pension, quinta, neto: round2(sueldo - pension - quinta) }
}

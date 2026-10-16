// Cálculos del régimen laboral general de Perú. Son referenciales: no reemplazan una liquidación
// oficial ni cubren regímenes especiales. Sin imports de React (se prueban con Node).

/** Bonificación extraordinaria sobre la gratificación: 9% (aporte EsSalud) o 6.75% (con EPS). */
export const BONIF_ESSALUD = 0.09
export const BONIF_EPS = 0.0675

export const parseMoney = (value: string): number => {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const formatSoles = (n: number): string =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n)

/** "YYYY-MM-DD" como fecha local (new Date('YYYY-MM-DD') sería UTC y correría un día). */
export const parseDate = (value: string): Date | null => {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const DAY_MS = 86_400_000

// Suma meses sin desbordar: 31 de enero + 1 mes = 28/29 de febrero, no marzo.
const addMonths = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return target
}

export type Tiempo = { months: number; days: number }

/** Meses completos y días sobrantes entre dos fechas, contando ambos extremos. */
export const tiempoComputable = (inicio: Date, fin: Date): Tiempo => {
  const end = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() + 1)
  if (end <= inicio) return { months: 0, days: 0 }

  let months = (end.getFullYear() - inicio.getFullYear()) * 12 + end.getMonth() - inicio.getMonth()
  if (addMonths(inicio, months) > end) months -= 1
  const days = Math.round((end.getTime() - addMonths(inicio, months).getTime()) / DAY_MS)
  return { months, days }
}

export type Remuneracion = {
  sueldo: number
  asignacionFamiliar: number
  /** Promedio mensual de comisiones, bonos y horas extras de los últimos 6 meses. */
  variables: number
}

export const remuneracionComputable = (r: Remuneracion): number =>
  r.sueldo + r.asignacionFamiliar + r.variables

export type Gratificacion = { base: number; bonificacion: number; total: number }

/** Gratificación de julio o diciembre por `meses` completos (0 a 6) del semestre. */
export const gratificacion = (rem: number, meses: number, tasaBonif: number): Gratificacion => {
  const base = (rem * Math.min(6, Math.max(0, meses))) / 6
  const bonificacion = base * tasaBonif
  return { base, bonificacion, total: base + bonificacion }
}

/** CTS: RC/12 por mes completo y RC/360 por día; RC incluye 1/6 de la última gratificación. */
export const cts = (rem: number, ultimaGratificacion: number, t: Tiempo): number => {
  const rc = rem + ultimaGratificacion / 6
  return (rc / 12) * t.months + (rc / 360) * t.days
}

/** Vacaciones: RC/12 por mes y RC/360 por día del período (la remuneración no incluye 1/6 de gratificación). */
export const vacaciones = (rem: number, t: Tiempo): number =>
  (rem / 12) * t.months + (rem / 360) * t.days

export type Liquidacion = {
  ctsPeriodo: Tiempo
  cts: number
  vacacionesPeriodo: Tiempo
  vacaciones: number
  gratificacionMeses: number
  gratificacion: Gratificacion
  total: number
}

/** Beneficios truncos al cese: CTS del semestre en curso, vacaciones del año de servicio y gratificación trunca. */
export const liquidacion = (
  ingreso: Date,
  cese: Date,
  rem: number,
  tasaBonif: number,
): Liquidacion => {
  const year = cese.getFullYear()
  const month = cese.getMonth() // 0 = enero

  // CTS se deposita el 15 de mayo y el 15 de noviembre: el período trunco parte del 1 de mayo o del 1 de noviembre.
  const ctsInicio =
    month >= 4 && month <= 9
      ? new Date(year, 4, 1)
      : new Date(month >= 10 ? year : year - 1, 10, 1)
  const ctsPeriodo = tiempoComputable(ctsInicio > ingreso ? ctsInicio : ingreso, cese)

  // Vacaciones: desde el último aniversario del ingreso (o desde el ingreso si no cumplió un año).
  let aniversario = ingreso
  while (addMonths(aniversario, 12) <= cese) aniversario = addMonths(aniversario, 12)
  const vacacionesPeriodo = tiempoComputable(aniversario, cese)

  // Gratificación: semestre enero-junio o julio-diciembre; solo cuentan los meses completos.
  const semestreInicio = new Date(year, month <= 5 ? 0 : 6, 1)
  const gratificacionMeses = tiempoComputable(
    semestreInicio > ingreso ? semestreInicio : ingreso,
    cese,
  ).months

  const grat = gratificacion(rem, gratificacionMeses, tasaBonif)
  const ctsMonto = cts(rem, rem, ctsPeriodo)
  const vacacionesMonto = vacaciones(rem, vacacionesPeriodo)

  return {
    ctsPeriodo,
    cts: ctsMonto,
    vacacionesPeriodo,
    vacaciones: vacacionesMonto,
    gratificacionMeses,
    gratificacion: grat,
    total: ctsMonto + vacacionesMonto + grat.total,
  }
}

/** Horas extras: 25% las 2 primeras horas del día y 35% desde la tercera. */
export const horasExtras = (
  sueldo: number,
  jornadaDiaria: number,
  horas25: number,
  horas35: number,
) => {
  const valorHora = jornadaDiaria > 0 ? sueldo / 30 / jornadaDiaria : 0
  const pago25 = valorHora * 1.25 * horas25
  const pago35 = valorHora * 1.35 * horas35
  return { valorHora, pago25, pago35, total: pago25 + pago35 }
}

export const igv = (monto: number, tasa: number, modo: 'agregar' | 'quitar') => {
  const factor = 1 + tasa / 100
  const base = modo === 'agregar' ? monto : monto / factor
  const impuesto = base * (tasa / 100)
  return { base, impuesto, total: base + impuesto }
}

const RUC_PESOS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
const RUC_TIPOS: Record<string, string> = {
  '10': 'Persona natural',
  '20': 'Persona jurídica',
  '15': 'Otro tipo de contribuyente',
  '16': 'Otro tipo de contribuyente',
  '17': 'Otro tipo de contribuyente',
}

export type RucResultado = { valido: boolean; motivo?: string; tipo?: string }

/** Valida formato y dígito verificador (módulo 11). No comprueba que el RUC exista en SUNAT. */
export const validarRuc = (ruc: string): RucResultado => {
  if (!/^\d{11}$/.test(ruc)) return { valido: false, motivo: 'El RUC debe tener 11 dígitos' }

  const tipo = RUC_TIPOS[ruc.slice(0, 2)]
  if (!tipo) return { valido: false, motivo: 'Los dos primeros dígitos no corresponden a un RUC' }

  const suma = RUC_PESOS.reduce((acc, peso, i) => acc + peso * Number(ruc[i]), 0)
  const verificador = (11 - (suma % 11)) % 10
  if (verificador !== Number(ruc[10])) {
    return { valido: false, motivo: 'El dígito verificador no coincide' }
  }
  return { valido: true, tipo }
}

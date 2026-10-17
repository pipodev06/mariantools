const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
const DIEZ_A_VEINTINUEVE = [
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete',
  'veintiocho', 'veintinueve',
]
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = [
  '', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos',
  'ochocientos', 'novecientos',
]

/** 0 a 999 en letras. */
const hasta999 = (n: number): string => {
  if (n === 100) return 'cien'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const partes: string[] = []
  if (c) partes.push(CENTENAS[c])
  if (resto >= 30) {
    const u = resto % 10
    partes.push(u ? `${DECENAS[Math.floor(resto / 10)]} y ${UNIDADES[u]}` : DECENAS[Math.floor(resto / 10)])
  } else if (resto >= 10) partes.push(DIEZ_A_VEINTINUEVE[resto - 10])
  else if (resto > 0 || !c) partes.push(UNIDADES[resto])
  return partes.join(' ')
}

// "uno" pierde la o delante de "mil" y "millones": veintiún mil, un millón.
const apocope = (texto: string) => texto.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')

/** Entero de 0 a 999 999 999 999 en letras (minúsculas). */
export const enteroALetras = (n: number): string => {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999_999) throw new RangeError('Número fuera de rango')
  if (n < 1000) return hasta999(n)

  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000
  const partes: string[] = []

  if (millones) {
    if (millones === 1) partes.push('un millón')
    else partes.push(`${apocope(enteroALetras(millones))} millones`)
  }
  if (miles) partes.push(miles === 1 ? 'mil' : `${apocope(hasta999(miles))} mil`)
  if (resto) partes.push(hasta999(resto))
  return partes.join(' ')
}

export type Moneda = 'soles' | 'dolares' | 'ninguna'

const MONEDA_TEXTO: Record<Moneda, string> = { soles: 'SOLES', dolares: 'DÓLARES AMERICANOS', ninguna: '' }

/**
 * Monto en letras al estilo de facturas y cheques en Perú: "MIL DOSCIENTOS TREINTA Y CUATRO CON 50/100 SOLES".
 * Los céntimos se redondean a dos dígitos.
 */
export const montoEnLetras = (monto: number, moneda: Moneda = 'soles'): string => {
  if (!Number.isFinite(monto) || monto < 0) throw new RangeError('Monto no válido')
  const totalCentimos = Math.round(monto * 100)
  const entero = Math.floor(totalCentimos / 100)
  const centimos = totalCentimos % 100
  const texto = `${enteroALetras(entero)} con ${String(centimos).padStart(2, '0')}/100 ${MONEDA_TEXTO[moneda]}`
  return texto.trim().toUpperCase()
}

// Códigos de barras EAN-13 y Code 128 (subconjunto B: texto ASCII imprimible), sin dependencias.
// El resultado es una cadena de módulos: '1' = barra, '0' = espacio, cada uno de un módulo de ancho.

const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
// Paridad (L/G) de los 6 dígitos de la izquierda según el primer dígito.
const EAN_PARIDAD = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

/** Dígito verificador de un EAN-13 a partir de sus 12 primeros dígitos. */
export const ean13CheckDigit = (doce: string): number => {
  if (!/^\d{12}$/.test(doce)) throw new Error('Se necesitan 12 dígitos')
  let suma = 0
  for (let i = 0; i < 12; i++) suma += Number(doce[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (suma % 10)) % 10
}

export type BarcodeResult = { bits: string; text: string }

/** Acepta 12 dígitos (calcula el verificador) o 13 (lo comprueba). */
export const encodeEan13 = (input: string): BarcodeResult => {
  const digits = input.replace(/\s/g, '')
  if (!/^\d{12,13}$/.test(digits)) throw new Error('El EAN-13 lleva 12 o 13 dígitos')
  const check = ean13CheckDigit(digits.slice(0, 12))
  if (digits.length === 13 && Number(digits[12]) !== check) {
    throw new Error(`El dígito verificador no coincide: debería ser ${check}`)
  }
  const code = digits.slice(0, 12) + check
  const paridad = EAN_PARIDAD[Number(code[0])]
  let bits = '101'
  for (let i = 1; i <= 6; i++) bits += (paridad[i - 1] === 'L' ? EAN_L : EAN_G)[Number(code[i])]
  bits += '01010'
  for (let i = 7; i <= 12; i++) bits += EAN_R[Number(code[i])]
  bits += '101'
  return { bits, text: code }
}

// Anchos (barra, espacio, barra, ...) de los 107 símbolos de Code 128. Cada uno suma 11 módulos; el de parada, 13.
const C128 = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]
const C128_START_B = 104
const C128_STOP = 106

const widthsToBits = (widths: string) =>
  [...widths].map((w, i) => (i % 2 === 0 ? '1' : '0').repeat(Number(w))).join('')

/** Code 128 B: letras, números y signos ASCII (sin tildes ni ñ). */
export const encodeCode128 = (text: string): BarcodeResult => {
  if (!text) throw new Error('Escribe el texto del código')
  if (text.length > 80) throw new Error('Máximo 80 caracteres')
  const values: number[] = []
  for (const ch of text) {
    const code = ch.charCodeAt(0)
    if (code < 32 || code > 126) throw new Error(`Carácter no permitido en Code 128: «${ch}»`)
    values.push(code - 32)
  }
  let checksum = C128_START_B
  values.forEach((v, i) => (checksum += v * (i + 1)))
  const symbols = [C128_START_B, ...values, checksum % 103, C128_STOP]
  return { bits: symbols.map((s) => widthsToBits(C128[s])).join(''), text }
}

/** Ancho total en módulos de cada símbolo (para pruebas: deben ser 11, salvo la parada con 13). */
export const code128SymbolWidths = () => C128.map((w) => [...w].reduce((s, d) => s + Number(d), 0))

export type BarcodeDrawOptions = { module: number; height: number; quiet: number; fontSize: number }

/** Dibuja el código en un canvas, con margen en blanco y el texto legible debajo. */
export const drawBarcode = (
  { bits, text }: BarcodeResult,
  { module, height, quiet, fontSize }: BarcodeDrawOptions = { module: 3, height: 120, quiet: 12, fontSize: 18 },
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = (bits.length + quiet * 2) * module
  canvas.height = height + fontSize + 16
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000'
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') ctx.fillRect((quiet + i) * module, 8, module, height)
  }
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(text, canvas.width / 2, height + fontSize + 10)
  return canvas
}

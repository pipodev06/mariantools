// Velocidades promedio en español: lectura silenciosa y lectura en voz alta (palabras por minuto).
const LECTURA_PPM = 200
const VOZ_PPM = 130

export type TextStats = {
  caracteres: number
  caracteresSinEspacios: number
  palabras: number
  oraciones: number
  parrafos: number
  /** Minutos redondeados hacia arriba; 0 si no hay texto. */
  minutosLectura: number
  minutosVoz: number
}

// Una palabra: letras o números, con apóstrofo o guion interno ("bien-estar", "l'amour").
const PALABRA = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu

export const textStats = (texto: string): TextStats => {
  const palabras = texto.match(PALABRA)?.length ?? 0
  // Graphemes: un emoji o una letra con tilde combinada cuentan como un solo carácter.
  const graphemes = [...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(texto)].map((s) => s.segment)
  const caracteres = graphemes.length
  const caracteresSinEspacios = graphemes.filter((g) => !/^\s+$/u.test(g)).length
  const oraciones = palabras ? texto.split(/[.!?…]+(?=\s|$)/u).filter((s) => /[\p{L}\p{N}]/u.test(s)).length : 0
  const parrafos = texto.split(/\n\s*\n/).filter((p) => p.trim()).length
  return {
    caracteres,
    caracteresSinEspacios,
    palabras,
    oraciones,
    parrafos,
    minutosLectura: palabras ? Math.ceil(palabras / LECTURA_PPM) : 0,
    minutosVoz: palabras ? Math.ceil(palabras / VOZ_PPM) : 0,
  }
}

// Postproceso puro de la salida de Tesseract (sin canvas ni worker): se prueba en tests/ocrText.test.ts.

/** Limpia la salida de Tesseract: espacios al final, palabras cortadas con guion al final de línea y saltos repetidos. */
export const cleanOcrText = (text: string): string =>
  text
    .replace(/\r/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/(\p{Ll})-\n(\p{Ll})/gu, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

// Una línea se conserva si tiene confianza aceptable, al menos una palabra de 2 caracteres y está hecha
// sobre todo de letras o números. Lo demás suele ser textura de la foto (pelo, follaje, una pantalla
// al fondo) que Tesseract interpreta como símbolos sueltos.
const MIN_LINE_CONFIDENCE = 30
// Entre 30 y 45 de confianza la línea solo pasa si sus palabras miden en promedio 3+ caracteres: el ruido
// de una foto sale como fragmentos de 1-2 letras ("EE A A A"), el texto real no.
const SURE_LINE_CONFIDENCE = 45
const MIN_AVG_TOKEN = 3
const MIN_ALNUM_RATIO = 0.6

export type Reading = { text: string; confidence: number; score: number }
export type TesseractPage = { text: string; confidence: number; blocks: { paragraphs: { lines: { text: string; confidence: number }[] }[] }[] | null }

export const looksLikeText = (line: { text: string; confidence: number }) => {
  const chars = line.text.replace(/\s/g, '')
  if (!chars || line.confidence < MIN_LINE_CONFIDENCE || !/[\p{L}\p{N}]{2,}/u.test(chars)) return false
  const alnum = chars.match(/[\p{L}\p{N}]/gu)?.length ?? 0
  if (alnum / chars.length < MIN_ALNUM_RATIO) return false
  if (line.confidence >= SURE_LINE_CONFIDENCE) return true
  const tokens = line.text.match(/[\p{L}\p{N}]+/gu) ?? []
  return tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length >= MIN_AVG_TOKEN
}

/** Texto de las líneas confiables, confianza promedio ponderada por largo y puntaje (texto confiable total). */
export const readPage = (page: TesseractPage): Reading => {
  if (!page.blocks) return { text: page.text, confidence: page.confidence, score: page.confidence * page.text.length }
  const paragraphs: string[] = []
  let weighted = 0
  let length = 0
  for (const block of page.blocks) {
    for (const paragraph of block.paragraphs) {
      const lines = paragraph.lines.filter(looksLikeText)
      if (lines.length === 0) continue
      paragraphs.push(lines.map((l) => l.text.replace(/\n+$/, '')).join('\n'))
      for (const l of lines) {
        weighted += l.confidence * l.text.length
        length += l.text.length
      }
    }
  }
  return { text: paragraphs.join('\n\n'), confidence: length ? weighted / length : 0, score: weighted }
}

import { describe, expect, it } from 'vitest'
import { cleanOcrText, looksLikeText, readPage, type TesseractPage } from '../src/lib/ocrText'

const page = (lines: [string, number][], confidence = 50): TesseractPage => ({
  text: lines.map(([t]) => t).join('\n'),
  confidence,
  blocks: [{ paragraphs: [{ lines: lines.map(([text, c]) => ({ text: `${text}\n`, confidence: c })) }] }],
})

describe('looksLikeText', () => {
  it('descarta la basura que deja la textura de una foto (salida real de un meme)', () => {
    for (const basura of [
      'A    ,    -  e      -',
      '_ = N {  " a   a >     -—-—  --',
      ')        NN NN  NN         y       7       —',
      'y         == — 7 e-   =',
      '>= — ..    .      >',
    ]) {
      expect(looksLikeText({ text: basura, confidence: 40 })).toBe(false)
    }
  })

  it('conserva las líneas reales del subtítulo', () => {
    expect(looksLikeText({ text: 'mirar mi pantalla por horas', confidence: 88 })).toBe(true)
    expect(looksLikeText({ text: 'errores que salen', confidence: 91 })).toBe(true)
  })

  it('con confianza media exige palabras de verdad, no fragmentos de 1-2 letras', () => {
    expect(looksLikeText({ text: 'Factura electrónica F001-000123', confidence: 38 })).toBe(true)
    expect(looksLikeText({ text: 'ESTA DEIS O A EE A A A', confidence: 35 })).toBe(false)
  })

  it('rechaza todo lo que tenga muy poca confianza', () => {
    expect(looksLikeText({ text: 'Total a pagar', confidence: 20 })).toBe(false)
  })
})

describe('readPage', () => {
  it('quita las líneas basura y conserva el texto con su confianza ponderada', () => {
    const r = readPage(
      page([
        ['E    e', 12],
        ['He dominado el arte de', 90],
        ['~~ Hedominado el arte de', 25],
        ['errores que salen', 80],
      ]),
    )
    expect(r.text).toBe('He dominado el arte de\nerrores que salen')
    expect(r.confidence).toBeGreaterThan(80)
    expect(r.score).toBeGreaterThan(0)
  })

  it('sin bloques usa el texto completo', () => {
    expect(readPage({ text: 'hola', confidence: 70, blocks: null }).text).toBe('hola')
  })

  it('si todo es basura no devuelve nada', () => {
    expect(readPage(page([['=- ~ .', 15]])).text).toBe('')
  })
})

describe('cleanOcrText', () => {
  it('une palabras cortadas con guion al final de línea y limpia espacios', () => {
    expect(cleanOcrText('docu-\nmento listo   \n\n\n\nfin\r')).toBe('documento listo\n\nfin')
  })

  it('no une guiones de números o mayúsculas', () => {
    expect(cleanOcrText('F001-\n000123')).toBe('F001-\n000123')
  })
})

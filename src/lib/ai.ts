import { callAi } from './aiClient'
import { prepareImageForAi } from './ocr'

export const MAX_AI_TEXT_LENGTH = 20000

export const TARGET_LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
  { value: 'de', label: 'Alemán' },
  { value: 'it', label: 'Italiano' },
]

export const SUMMARY_LENGTH_OPTIONS = [
  { value: 'short', label: 'Corto' },
  { value: 'medium', label: 'Medio' },
  { value: 'long', label: 'Largo' },
]

export const transcribeHandwriting = async (file: File) =>
  callAi({ task: 'manuscrito', image: await prepareImageForAi(file) })

export const translateImage = async (file: File, lang: string) =>
  callAi({ task: 'traducir-imagen', image: await prepareImageForAi(file), lang })

export const extractTable = async (file: File): Promise<string[][]> => {
  const raw = await callAi({ task: 'tabla', image: await prepareImageForAi(file) })

  let parsed: { rows?: unknown }
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('La IA no devolvió un JSON válido')
  }

  if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) {
    throw new Error('No se encontró una tabla en la imagen')
  }
  return parsed.rows.map((row) =>
    Array.isArray(row) ? row.map((cell) => (cell == null ? '' : String(cell))) : [String(row)],
  )
}

export const correctText = (text: string) => callAi({ task: 'corregir', text })

export const summarizeText = (text: string, length: string) =>
  callAi({ task: 'resumir', text, length })

// Las celdas vienen de texto de una imagen: las que empiezan con = + - @ se neutralizan con un
// apóstrofo para que Excel no las ejecute como fórmula.
const csvEscape = (raw: string) => {
  const value = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export const tableToCsv = (rows: string[][]) =>
  rows.map((row) => row.map(csvEscape).join(',')).join('\n')

import { createOcrWorker, recognizeCanvasWithTesseract } from './ocr'
import { pdfjs } from './pdfjs'

// Una página con menos caracteres que esto se considera escaneada (sin capa de texto).
const MIN_TEXT_CHARS = 20
// ~216 DPI: más nitidez para el OCR de páginas escaneadas sin pasarse de memoria en A4.
const OCR_RENDER_SCALE = 3

type PositionedText = { str: string; transform: number[]; width: number; height: number; hasEOL?: boolean }

/**
 * Une los fragmentos de la capa de texto según su posición. Algunos PDF guardan cada letra o sílaba
 * por separado: unirlos siempre con espacio rompía las palabras ("H o l a"). Aquí solo se pone espacio
 * si hay un hueco real entre fragmentos y salto de línea cuando cambia la altura del renglón.
 */
const joinTextItems = (items: unknown[]): string => {
  let out = ''
  let prev: { right: number; y: number; size: number } | null = null
  for (const raw of items) {
    if (!raw || typeof raw !== 'object' || !('str' in raw)) continue
    const item = raw as PositionedText
    const x = item.transform[4]
    const y = item.transform[5]
    const size = Math.abs(item.height || item.transform[3]) || 10
    if (prev && item.str) {
      if (Math.abs(y - prev.y) > prev.size * 0.5) out += '\n'
      else if (x - prev.right > size * 0.2 && !/\s$/.test(out) && !/^\s/.test(item.str)) out += ' '
    }
    out += item.str
    if (item.hasEOL) {
      out += '\n'
      prev = null
    } else if (item.str) {
      prev = { right: x + item.width, y, size }
    }
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
}

export type PdfTextResult = {
  text: string
  /** Texto de cada página, en orden. */
  pageTexts: string[]
  pages: number
  ocrPages: number
}

/**
 * Extrae el texto de un PDF. Las páginas con capa de texto se leen directo;
 * las escaneadas se renderizan a canvas y pasan por Tesseract (en el navegador).
 */
export const extractPdfText = async (
  file: File,
  onProgress: (done: number, total: number) => void,
): Promise<PdfTextResult> => {
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const pdf = await task.promise
  const total = pdf.numPages
  const pages: string[] = []
  let ocrPages = 0
  let worker: Awaited<ReturnType<typeof createOcrWorker>> | null = null

  try {
    for (let n = 1; n <= total; n++) {
      const page = await pdf.getPage(n)
      const content = await page.getTextContent()
      let text = joinTextItems(content.items).trim()

      if (text.length < MIN_TEXT_CHARS) {
        const viewport = page.getViewport({ scale: OCR_RENDER_SCALE })
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(viewport.width)
        canvas.height = Math.round(viewport.height)
        await page.render({ canvas, viewport }).promise

        worker ??= await createOcrWorker()
        text = (await recognizeCanvasWithTesseract(worker, canvas)).text
        ocrPages++
      }

      pages.push(text)
      onProgress(n, total)
    }
  } finally {
    await worker?.terminate()
    await task.destroy()
  }

  return { text: pages.join('\n\n'), pageTexts: pages, pages: total, ocrPages }
}

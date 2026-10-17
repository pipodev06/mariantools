import { createOcrWorker, recognizeCanvasWithTesseract } from './ocr'
import { pdfjs } from './pdfjs'
import { joinTextItems } from './pdfTextLayer'

// Una página con menos caracteres que esto se considera escaneada (sin capa de texto).
const MIN_TEXT_CHARS = 20
// ~216 DPI: más nitidez para el OCR de páginas escaneadas sin pasarse de memoria en A4.
const OCR_RENDER_SCALE = 3

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

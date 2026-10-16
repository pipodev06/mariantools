import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { createOcrWorker, recognizeCanvasWithTesseract } from './ocr'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

// Una página con menos caracteres que esto se considera escaneada (sin capa de texto).
const MIN_TEXT_CHARS = 20
const OCR_RENDER_SCALE = 2

export type PdfTextResult = {
  text: string
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
      let text = ''
      for (const item of content.items) {
        if ('str' in item) text += item.str + (item.hasEOL ? '\n' : ' ')
      }
      text = text.trim()

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

  return { text: pages.join('\n\n'), pages: total, ocrPages }
}

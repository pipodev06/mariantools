import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import { zipSync } from 'fflate'
import { Document, Packer, Paragraph } from 'docx'
import { bytesToBlob } from './bytes'
import { pdfjs } from './pdfjs'
import { extractPdfText } from './pdfText'

type Progress = (done: number, total: number) => void

export type PdfResult = { blob: Blob; filename: string }

const baseName = (file: File) => file.name.replace(/\.[^.]+$/, '')

const loadDoc = async (file: File): Promise<PDFDocument> => {
  try {
    return await PDFDocument.load(await file.arrayBuffer())
  } catch {
    throw new Error('No se pudo leer el PDF. Puede estar dañado o tener contraseña.')
  }
}

const saveDoc = async (doc: PDFDocument, filename: string): Promise<PdfResult> => ({
  blob: bytesToBlob(await doc.save(), 'application/pdf'),
  filename,
})

export const rotatePdf = async (file: File, angle: 90 | 180 | 270): Promise<PdfResult> => {
  const doc = await loadDoc(file)
  for (const page of doc.getPages()) {
    page.setRotation(degrees((page.getRotation().angle + angle) % 360))
  }
  return saveDoc(doc, `${baseName(file)}-rotado.pdf`)
}

export type NumberingOptions = {
  position: 'left' | 'center' | 'right'
  format: 'n' | 'n-de-total'
  start: number
}

export const numberPages = async (file: File, options: NumberingOptions): Promise<PdfResult> => {
  const doc = await loadDoc(file)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const pages = doc.getPages()
  const size = 10
  const margin = 36

  pages.forEach((page, i) => {
    const n = options.start + i
    const text =
      options.format === 'n' ? `${n}` : `Página ${n} de ${options.start + pages.length - 1}`
    const textWidth = font.widthOfTextAtSize(text, size)
    const { width } = page.getSize()
    const x =
      options.position === 'left'
        ? margin
        : options.position === 'center'
          ? (width - textWidth) / 2
          : width - margin - textWidth
    page.drawText(text, { x, y: 24, size, font, color: rgb(0.2, 0.2, 0.2) })
  })
  return saveDoc(doc, `${baseName(file)}-numerado.pdf`)
}

export type CropMargins = { top: number; bottom: number; left: number; right: number }

const MM_TO_PT = 72 / 25.4

/** Recorta cada página quitando los márgenes (en mm) por cada lado. */
export const cropPdf = async (file: File, margins: CropMargins): Promise<PdfResult> => {
  const doc = await loadDoc(file)
  for (const page of doc.getPages()) {
    const { x, y, width, height } = page.getMediaBox()
    const left = margins.left * MM_TO_PT
    const bottom = margins.bottom * MM_TO_PT
    const newWidth = width - left - margins.right * MM_TO_PT
    const newHeight = height - bottom - margins.top * MM_TO_PT
    if (newWidth <= 0 || newHeight <= 0) {
      throw new Error('Los márgenes son mayores que la página')
    }
    page.setMediaBox(x + left, y + bottom, newWidth, newHeight)
    page.setCropBox(x + left, y + bottom, newWidth, newHeight)
  }
  return saveDoc(doc, `${baseName(file)}-recortado.pdf`)
}

const canvasToJpeg = (canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => (blob ? resolve(new Uint8Array(await blob.arrayBuffer())) : reject(new Error('No se pudo generar la imagen'))),
      'image/jpeg',
      quality,
    )
  })

/** Renderiza cada página de un PDF y llama a `onPage` con su JPEG. */
const renderPages = async (
  file: File,
  scale: number,
  quality: number,
  onProgress: Progress,
  onPage: (jpeg: Uint8Array, size: { width: number; height: number }, index: number) => Promise<void> | void,
) => {
  let task
  try {
    task = pdfjs.getDocument({ data: await file.arrayBuffer() })
    const pdf = await task.promise
    const total = pdf.numPages
    for (let n = 1; n <= total; n++) {
      const page = await pdf.getPage(n)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
      // JPEG no tiene transparencia: se pinta de blanco antes de renderizar.
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, viewport }).promise

      const base = page.getViewport({ scale: 1 })
      await onPage(await canvasToJpeg(canvas, quality), { width: base.width, height: base.height }, n - 1)
      onProgress(n, total)
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('No se pudo')) throw err
    throw new Error('No se pudo leer el PDF. Puede estar dañado o tener contraseña.', { cause: err })
  } finally {
    await task?.destroy()
  }
}

export const COMPRESSION_LEVELS = {
  alta: { label: 'Máxima compresión', scale: 1, quality: 0.5 },
  media: { label: 'Equilibrada', scale: 1.5, quality: 0.65 },
  baja: { label: 'Mejor calidad', scale: 2, quality: 0.8 },
} as const

export type CompressionLevel = keyof typeof COMPRESSION_LEVELS

/** Reconstruye el PDF con cada página como imagen JPEG: pesa menos pero el texto deja de seleccionarse. */
export const compressPdf = async (
  file: File,
  level: CompressionLevel,
  onProgress: Progress,
): Promise<PdfResult> => {
  const { scale, quality } = COMPRESSION_LEVELS[level]
  const out = await PDFDocument.create()

  await renderPages(file, scale, quality, onProgress, async (jpeg, size) => {
    const image = await out.embedJpg(jpeg)
    const page = out.addPage([size.width, size.height])
    page.drawImage(image, { x: 0, y: 0, width: size.width, height: size.height })
  })
  return saveDoc(out, `${baseName(file)}-comprimido.pdf`)
}

export const pdfToJpgZip = async (file: File, onProgress: Progress): Promise<PdfResult> => {
  const files: Record<string, Uint8Array> = {}
  await renderPages(file, 2, 0.9, onProgress, (jpeg, _size, index) => {
    files[`pagina-${index + 1}.jpg`] = jpeg
  })
  // JPEG ya está comprimido: el zip solo agrupa (nivel 0).
  return { blob: bytesToBlob(zipSync(files, { level: 0 }), 'application/zip'), filename: `${baseName(file)}-jpg.zip` }
}

/** Solo texto: se pierde el diseño original. Las páginas escaneadas pasan por OCR. */
export const pdfToDocx = async (file: File, onProgress: Progress): Promise<PdfResult> => {
  const { pageTexts } = await extractPdfText(file, onProgress)

  const children = pageTexts.flatMap((text, pageIndex) => {
    const lines = text.split('\n').filter((line) => line.trim())
    return (lines.length ? lines : ['']).map(
      (line, i) => new Paragraph({ text: line, pageBreakBefore: pageIndex > 0 && i === 0 }),
    )
  })

  const doc = new Document({ sections: [{ children }] })
  return { blob: await Packer.toBlob(doc), filename: `${baseName(file)}.docx` }
}

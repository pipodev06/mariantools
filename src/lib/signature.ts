import { PDFDocument } from 'pdf-lib'
import { bytesToBlob } from './bytes'

export type SignaturePosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'center'

const MARGIN = 36 // 0.5in en puntos

const computePosition = (
  position: SignaturePosition,
  pageWidth: number,
  pageHeight: number,
  sigWidth: number,
  sigHeight: number,
) => {
  switch (position) {
    case 'bottom-right':
      return { x: pageWidth - sigWidth - MARGIN, y: MARGIN }
    case 'bottom-left':
      return { x: MARGIN, y: MARGIN }
    case 'bottom-center':
      return { x: (pageWidth - sigWidth) / 2, y: MARGIN }
    case 'top-right':
      return { x: pageWidth - sigWidth - MARGIN, y: pageHeight - sigHeight - MARGIN }
    case 'top-left':
      return { x: MARGIN, y: pageHeight - sigHeight - MARGIN }
    case 'center':
      return { x: (pageWidth - sigWidth) / 2, y: (pageHeight - sigHeight) / 2 }
  }
}

export const embedSignature = async (
  file: File,
  pageIndex: number,
  signatureDataUrl: string,
  position: SignaturePosition,
  widthPt: number,
): Promise<Blob> => {
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  const pages = pdfDoc.getPages()
  const page = pages[Math.min(pageIndex, pages.length - 1)]
  if (!page) throw new Error('El PDF no tiene páginas')

  const pngImage = await pdfDoc.embedPng(signatureDataUrl)
  const scale = widthPt / pngImage.width
  const sigWidth = widthPt
  const sigHeight = pngImage.height * scale

  const { width: pageWidth, height: pageHeight } = page.getSize()
  const { x, y } = computePosition(position, pageWidth, pageHeight, sigWidth, sigHeight)

  page.drawImage(pngImage, { x, y, width: sigWidth, height: sigHeight })

  const out = await pdfDoc.save()
  return bytesToBlob(out, 'application/pdf')
}

export const getPdfPageCount = async (file: File): Promise<number> => {
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  return pdfDoc.getPageCount()
}

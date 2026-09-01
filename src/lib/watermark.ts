import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'
import { bytesToBlob } from './bytes'

const hexToRgb01 = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}

export const watermarkImage = async (
  file: File,
  text: string,
  color: string,
  opacity: number,
  fontSize: number,
): Promise<string> => {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  ctx.drawImage(bitmap, 0, 0)
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((-30 * Math.PI) / 180)
  ctx.fillText(text, 0, 0)
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export const watermarkPdf = async (
  file: File,
  text: string,
  color: string,
  opacity: number,
  fontSize: number,
): Promise<Blob> => {
  const bytes = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(bytes)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const [r, g, b] = hexToRgb01(color)

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, fontSize)
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(45),
    })
  }

  const out = await pdfDoc.save()
  return bytesToBlob(out, 'application/pdf')
}

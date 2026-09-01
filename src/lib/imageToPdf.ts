import { jsPDF } from 'jspdf'

const MAX_DIMENSION = 2000

const fileToPngDataUrl = async (file: File): Promise<{ dataUrl: string; width: number; height: number }> => {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.drawImage(bitmap, 0, 0, width, height)

  return { dataUrl: canvas.toDataURL('image/png'), width, height }
}

export const buildPdfFromImages = async (files: File[]): Promise<Blob> => {
  if (files.length === 0) throw new Error('No hay imágenes')

  const first = await fileToPngDataUrl(files[0])
  const doc = new jsPDF({ unit: 'px', format: [first.width, first.height] })
  doc.addImage(first.dataUrl, 'PNG', 0, 0, first.width, first.height)

  for (let i = 1; i < files.length; i++) {
    const { dataUrl, width, height } = await fileToPngDataUrl(files[i])
    doc.addPage([width, height])
    doc.addImage(dataUrl, 'PNG', 0, 0, width, height)
  }

  return doc.output('blob')
}

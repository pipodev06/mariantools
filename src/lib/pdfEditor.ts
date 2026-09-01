import { PDFDocument } from 'pdf-lib'
import { bytesToBlob } from './bytes'

export type LoadedPdf = {
  name: string
  doc: PDFDocument
}

export type PdfPageEntry = {
  id: string
  sourceIndex: number
  pageIndex: number
  sourceName: string
}

export const loadPdfFile = async (file: File): Promise<LoadedPdf> => {
  const bytes = await file.arrayBuffer()
  const doc = await PDFDocument.load(bytes)
  return { name: file.name, doc }
}

export const buildEntries = (sources: LoadedPdf[], startIndex: number): PdfPageEntry[] => {
  const entries: PdfPageEntry[] = []
  sources.forEach((source, sourceIndex) => {
    const realIndex = startIndex + sourceIndex
    for (let pageIndex = 0; pageIndex < source.doc.getPageCount(); pageIndex++) {
      entries.push({
        id: `${realIndex}-${pageIndex}-${Math.random().toString(36).slice(2, 8)}`,
        sourceIndex: realIndex,
        pageIndex,
        sourceName: source.name,
      })
    }
  })
  return entries
}

export const exportPages = async (sources: LoadedPdf[], entries: PdfPageEntry[]): Promise<Blob> => {
  const output = await PDFDocument.create()
  for (const entry of entries) {
    const source = sources[entry.sourceIndex]
    const [copied] = await output.copyPages(source.doc, [entry.pageIndex])
    output.addPage(copied)
  }
  const bytes = await output.save()
  return bytesToBlob(bytes, 'application/pdf')
}

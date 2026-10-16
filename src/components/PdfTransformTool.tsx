import type { ReactNode } from 'react'
import FileTransformTool from './FileTransformTool'
import type { PdfResult } from '../lib/pdfTools'

type Props = {
  title: string
  subtitle: string
  actionLabel: string
  busyLabel: string
  /** Opciones de la operación (selectores, números). */
  controls?: ReactNode
  run: (file: File, onProgress: (done: number, total: number) => void) => Promise<PdfResult>
}

/** Un PDF entra, se le aplica una operación y se descarga el resultado (rotar, comprimir, PDF a JPG...). */
const PdfTransformTool = (props: Props) => (
  <FileTransformTool
    {...props}
    accept=".pdf,application/pdf"
    dropLabel="Arrastra tu PDF aquí o haz click para elegirlo"
    dropHint="Formato: PDF."
  />
)

export default PdfTransformTool

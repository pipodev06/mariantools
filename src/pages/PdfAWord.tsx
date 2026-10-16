import PdfTransformTool from '../components/PdfTransformTool'
import { pdfToDocx } from '../lib/pdfTools'

const PdfAWord = () => (
  <PdfTransformTool
    title="PDF a Word"
    subtitle="Pasa el texto de tu PDF a un documento Word editable. No conserva el diseño original."
    actionLabel="Convertir a Word"
    busyLabel="Leyendo páginas"
    run={pdfToDocx}
  />
)

export default PdfAWord

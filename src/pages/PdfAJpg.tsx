import PdfTransformTool from '../components/PdfTransformTool'
import { pdfToJpgZip } from '../lib/pdfTools'

const PdfAJpg = () => (
  <PdfTransformTool
    currentHref="/pdf-a-jpg"
    title="PDF a JPG"
    subtitle="Convierte cada página de tu PDF en una imagen JPG, en un archivo ZIP."
    actionLabel="Convertir a JPG"
    busyLabel="Convirtiendo"
    run={pdfToJpgZip}
  />
)

export default PdfAJpg

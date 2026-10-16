import SingleFileTextTool from '../components/SingleFileTextTool'
import { extractPdfText } from '../lib/pdfText'

const PdfATexto = () => (
  <SingleFileTextTool
    currentHref="/pdf-a-texto"
    title="PDF a texto"
    subtitle="Extrae el texto de un PDF, incluso si está escaneado."
    accept=".pdf,application/pdf"
    dropLabel="Arrastra tu PDF aquí o haz click para elegirlo"
    dropHint="Las páginas escaneadas se leen con OCR en tu navegador."
    busyLabel="Leyendo páginas"
    run={async (file, onProgress) => {
      const { text, pages, ocrPages } = await extractPdfText(file, onProgress)
      return {
        text,
        note: `${pages} páginas${ocrPages > 0 ? `, ${ocrPages} con OCR` : ''}`,
      }
    }}
  />
)

export default PdfATexto

import { useState } from 'react'
import PdfTransformTool from '../components/PdfTransformTool'
import { SelectField } from '../components/FormFields'
import { COMPRESSION_LEVELS, compressPdf, type CompressionLevel } from '../lib/pdfTools'

const OPTIONS = Object.entries(COMPRESSION_LEVELS).map(([value, { label }]) => ({ value, label }))

const ComprimirPdf = () => {
  const [level, setLevel] = useState<CompressionLevel>('media')

  return (
    <PdfTransformTool
      title="Comprimir PDF"
      subtitle="Reduce el peso de tu PDF. Las páginas se convierten en imagen, así que el texto deja de poder seleccionarse."
      actionLabel="Comprimir PDF"
      busyLabel="Comprimiendo"
      controls={
        <SelectField
          label="Nivel"
          value={level}
          onChange={(value) => setLevel(value as CompressionLevel)}
          options={OPTIONS}
        />
      }
      run={(file, onProgress) => compressPdf(file, level, onProgress)}
    />
  )
}

export default ComprimirPdf

import { useState } from 'react'
import PdfTransformTool from '../components/PdfTransformTool'
import { SelectField } from '../components/FormFields'
import { rotatePdf } from '../lib/pdfTools'

const ANGLES = [
  { value: '90', label: '90° a la derecha' },
  { value: '180', label: '180°' },
  { value: '270', label: '90° a la izquierda' },
]

const RotarPdf = () => {
  const [angle, setAngle] = useState('90')

  return (
    <PdfTransformTool
      currentHref="/rotar-pdf"
      title="Rotar PDF"
      subtitle="Gira todas las páginas de tu PDF y descarga el resultado."
      actionLabel="Rotar PDF"
      busyLabel="Rotando"
      controls={<SelectField label="Giro" value={angle} onChange={setAngle} options={ANGLES} />}
      run={(file) => rotatePdf(file, Number(angle) as 90 | 180 | 270)}
    />
  )
}

export default RotarPdf

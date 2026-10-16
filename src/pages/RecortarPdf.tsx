import { useState } from 'react'
import PdfTransformTool from '../components/PdfTransformTool'
import { NumberField } from '../components/FormFields'
import { cropPdf } from '../lib/pdfTools'

const RecortarPdf = () => {
  const [margins, setMargins] = useState({ top: '10', bottom: '10', left: '10', right: '10' })
  const set = (side: keyof typeof margins) => (value: string) =>
    setMargins((prev) => ({ ...prev, [side]: value }))

  return (
    <PdfTransformTool
      title="Recortar PDF"
      subtitle="Quita los márgenes de todas las páginas. Medidas en milímetros."
      actionLabel="Recortar PDF"
      busyLabel="Recortando"
      controls={
        <>
          <NumberField label="Arriba (mm)" value={margins.top} onChange={set('top')} />
          <NumberField label="Abajo (mm)" value={margins.bottom} onChange={set('bottom')} />
          <NumberField label="Izquierda (mm)" value={margins.left} onChange={set('left')} />
          <NumberField label="Derecha (mm)" value={margins.right} onChange={set('right')} />
        </>
      }
      run={(file) =>
        cropPdf(file, {
          top: Number(margins.top) || 0,
          bottom: Number(margins.bottom) || 0,
          left: Number(margins.left) || 0,
          right: Number(margins.right) || 0,
        })
      }
    />
  )
}

export default RecortarPdf

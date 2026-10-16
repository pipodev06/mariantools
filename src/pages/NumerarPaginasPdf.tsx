import { useState } from 'react'
import PdfTransformTool from '../components/PdfTransformTool'
import { NumberField, SelectField } from '../components/FormFields'
import { numberPages, type NumberingOptions } from '../lib/pdfTools'

const POSITIONS = [
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
  { value: 'left', label: 'Izquierda' },
]

const FORMATS = [
  { value: 'n', label: '1, 2, 3...' },
  { value: 'n-de-total', label: 'Página 1 de N' },
]

const NumerarPaginasPdf = () => {
  const [position, setPosition] = useState('center')
  const [format, setFormat] = useState('n')
  const [start, setStart] = useState('1')

  return (
    <PdfTransformTool
      title="Numerar páginas de un PDF"
      subtitle="Agrega el número de página al pie de cada hoja."
      actionLabel="Numerar páginas"
      busyLabel="Numerando"
      controls={
        <>
          <SelectField label="Posición" value={position} onChange={setPosition} options={POSITIONS} />
          <SelectField label="Formato" value={format} onChange={setFormat} options={FORMATS} />
          <NumberField label="Empezar en" value={start} onChange={setStart} min={0} step={1} />
        </>
      }
      run={(file) =>
        numberPages(file, {
          position: position as NumberingOptions['position'],
          format: format as NumberingOptions['format'],
          start: Math.trunc(Number(start)) || 1,
        })
      }
    />
  )
}

export default NumerarPaginasPdf

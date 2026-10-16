import { useState } from 'react'
import FileTransformTool from '../components/FileTransformTool'
import { SelectField } from '../components/FormFields'
import { rotateFlipImage, type Angle, type Flip } from '../lib/imageTools'

const ANGLES = [
  { value: '0', label: 'Sin giro' },
  { value: '90', label: '90° a la derecha' },
  { value: '180', label: '180°' },
  { value: '270', label: '90° a la izquierda' },
]

const FLIPS = [
  { value: 'none', label: 'No voltear' },
  { value: 'horizontal', label: 'Horizontal (espejo)' },
  { value: 'vertical', label: 'Vertical' },
]

const RotarImagen = () => {
  const [angle, setAngle] = useState('90')
  const [flip, setFlip] = useState('none')

  return (
    <FileTransformTool
      title="Rotar y voltear imagen"
      subtitle="Gira tu imagen o dale la vuelta, y descárgala corregida."
      actionLabel="Aplicar"
      busyLabel="Procesando"
      accept=".jpg,.jpeg,.png,.webp"
      dropLabel="Arrastra tu imagen aquí o haz click para elegirla"
      dropHint="Formatos: JPG, PNG, WebP."
      controls={
        <>
          <SelectField label="Giro" value={angle} onChange={setAngle} options={ANGLES} />
          <SelectField label="Voltear" value={flip} onChange={setFlip} options={FLIPS} />
        </>
      }
      run={(file) => rotateFlipImage(file, Number(angle) as Angle, flip as Flip)}
    />
  )
}

export default RotarImagen

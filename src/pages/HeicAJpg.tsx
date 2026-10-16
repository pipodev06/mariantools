import { useState } from 'react'
import FileTransformTool from '../components/FileTransformTool'
import { SelectField } from '../components/FormFields'
import { heicToImage, type HeicTarget } from '../lib/imageTools'

const TARGETS = [
  { value: 'image/jpeg', label: 'JPG' },
  { value: 'image/png', label: 'PNG' },
]

const HeicAJpg = () => {
  const [target, setTarget] = useState('image/jpeg')

  return (
    <FileTransformTool
      title="HEIC a JPG"
      subtitle="Convierte las fotos de tu iPhone (HEIC) a JPG o PNG."
      actionLabel="Convertir"
      busyLabel="Convirtiendo"
      accept=".heic,.heif,image/heic,image/heif"
      dropLabel="Arrastra tu foto HEIC aquí o haz click para elegirla"
      dropHint="Formatos: HEIC, HEIF."
      controls={<SelectField label="Formato de salida" value={target} onChange={setTarget} options={TARGETS} />}
      run={(file) => heicToImage(file, target as HeicTarget)}
    />
  )
}

export default HeicAJpg

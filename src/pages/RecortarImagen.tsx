import { useState } from 'react'
import ErrorNotice from '../components/ErrorNotice'
import Cropper, { type Area } from 'react-easy-crop'
import { IconDownload, IconLoader2, IconRefresh } from '@tabler/icons-react'
import FileDropzone from '../components/FileDropzone'
import ToolShell from '../components/ToolShell'
import { cropImage } from '../lib/imageTools'
import { FOCUS_RING, BUTTON_PRIMARY, BUTTON_SECONDARY, CHIP_ACTIVE, CHIP_INACTIVE } from '../lib/ui'

const SHAPES = [
  { key: '1:1', label: '1:1', aspect: 1, round: false },
  { key: '4:3', label: '4:3', aspect: 4 / 3, round: false },
  { key: '16:9', label: '16:9', aspect: 16 / 9, round: false },
  { key: '3:4', label: '3:4', aspect: 3 / 4, round: false },
  { key: '9:16', label: '9:16', aspect: 9 / 16, round: false },
  { key: 'circle', label: 'Círculo', aspect: 1, round: true },
]

type Result = { url: string; filename: string }

const RecortarImagen = () => {
  const [image, setImage] = useState<{ file: File; url: string } | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [shapeKey, setShapeKey] = useState(SHAPES[0].key)
  const [area, setArea] = useState<Area | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const shape = SHAPES.find((s) => s.key === shapeKey) ?? SHAPES[0]

  const clearResult = () => {
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
  }

  const reset = () => {
    clearResult()
    if (image) URL.revokeObjectURL(image.url)
    setImage(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setArea(null)
    setError('')
  }

  const pickFile = (file: File) => {
    reset()
    setImage({ file, url: URL.createObjectURL(file) })
  }

  const handleCrop = async () => {
    if (!image || !area) return
    setIsRunning(true)
    setError('')
    clearResult()
    try {
      const output = await cropImage(image.file, area, shape.round)
      setResult({ url: URL.createObjectURL(output.blob), filename: output.filename })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <ToolShell title="Recortar imagen" subtitle="Elige la forma, mueve y haz zoom para recortar tu imagen.">
      {!image && (
        <div className="mt-8">
          <FileDropzone
            accept=".jpg,.jpeg,.png,.webp"
            label="Arrastra tu imagen aquí o haz click para elegirla"
            hint="Formatos: JPG, PNG, WebP."
            onFile={pickFile}
          />
        </div>
      )}

      {image && (
        <div className="mt-8 space-y-6">
          <button type="button" onClick={reset} disabled={isRunning} className={BUTTON_SECONDARY}>
            <IconRefresh size={18} />
            Otra imagen
          </button>

          <div className="relative h-96 overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800">
            <Cropper
              image={image.url}
              crop={crop}
              zoom={zoom}
              aspect={shape.aspect}
              cropShape={shape.round ? 'round' : 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Forma del recorte">
            {SHAPES.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={shapeKey === s.key}
                onClick={() => setShapeKey(s.key)}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors ${FOCUS_RING} ${
                  shapeKey === s.key
                    ? CHIP_ACTIVE
                    : CHIP_INACTIVE
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="max-w-sm">
            <label htmlFor="recortar-zoom" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Zoom
            </label>
            <input
              id="recortar-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={`mt-2 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
            />
          </div>

          <button
            type="button"
            disabled={isRunning || !area}
            onClick={handleCrop}
            className={BUTTON_PRIMARY}
          >
            {isRunning && <IconLoader2 size={18} className="animate-spin" />}
            <span role="status">{isRunning ? 'Recortando...' : 'Recortar'}</span>
          </button>

          {error && (
            <ErrorNotice message={error} />
          )}

          {result && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <img
                src={result.url}
                alt={result.filename}
                className="max-h-48 max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-800"
              />
              <a href={result.url} download={result.filename} className={BUTTON_SECONDARY}>
                <IconDownload size={18} />
                Descargar
              </a>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  )
}

export default RecortarImagen

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { IconCamera, IconDownload, IconLoader2, IconRefresh } from '@tabler/icons-react'
import ToolShell from '../components/ToolShell'
import ErrorNotice from '../components/ErrorNotice'
import FileDropzone from '../components/FileDropzone'
import { SelectField } from '../components/FormFields'
import { buildPdfFromImages } from '../lib/imageToPdf'
import { binarizeDocument } from '../lib/ocr'
import { warpPerspective, type Point } from '../lib/perspective'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FOCUS_RING } from '../lib/ui'

// Lado máximo de la foto de trabajo: suficiente para leer un A4 sin trabar el navegador del celular.
const MAX_SIDE = 2400
// Margen inicial de las esquinas (fracción del lado) para que se vean y se puedan agarrar.
const INSET = 0.08
const KEY_STEP = 0.01

const MODOS = [
  { value: 'color', label: 'Color' },
  { value: 'bn', label: 'Blanco y negro (documento)' },
]
const CORNER_LABELS = ['Esquina superior izquierda', 'Esquina superior derecha', 'Esquina inferior derecha', 'Esquina inferior izquierda']

type Source = { canvas: HTMLCanvasElement; url: string; name: string }

const loadSource = async (file: File): Promise<Source> => {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
  if (!blob) throw new Error('No se pudo leer la imagen')
  return { canvas, url: URL.createObjectURL(blob), name: file.name.replace(/\.[^.]+$/, '') }
}

const defaultCorners = (w: number, h: number): Point[] => [
  { x: w * INSET, y: h * INSET },
  { x: w * (1 - INSET), y: h * INSET },
  { x: w * (1 - INSET), y: h * (1 - INSET) },
  { x: w * INSET, y: h * (1 - INSET) },
]

const EscanearDocumento = () => {
  const [source, setSource] = useState<Source | null>(null)
  const [corners, setCorners] = useState<Point[]>([])
  const [modo, setModo] = useState('color')
  const [result, setResult] = useState<{ canvas: HTMLCanvasElement; url: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const frameRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const dragging = useRef<number | null>(null)

  useEffect(() => (source ? () => URL.revokeObjectURL(source.url) : undefined), [source])
  useEffect(() => (result ? () => URL.revokeObjectURL(result.url) : undefined), [result])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('El archivo no es una imagen')
    setError('')
    setResult(null)
    try {
      const loaded = await loadSource(file)
      setSource(loaded)
      setCorners(defaultCorners(loaded.canvas.width, loaded.canvas.height))
    } catch {
      setError('No se pudo abrir la imagen. Prueba con una foto JPG o PNG.')
    }
  }

  const toImagePoint = (e: PointerEvent): Point | null => {
    const frame = frameRef.current
    if (!frame || !source) return null
    const rect = frame.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * source.canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * source.canvas.height
    return {
      x: Math.max(0, Math.min(source.canvas.width, x)),
      y: Math.max(0, Math.min(source.canvas.height, y)),
    }
  }

  const moveCorner = (index: number, point: Point) =>
    setCorners((prev) => prev.map((c, i) => (i === index ? point : c)))

  const onPointerMove = (e: PointerEvent) => {
    if (dragging.current === null) return
    const point = toImagePoint(e)
    if (point) moveCorner(dragging.current, point)
  }

  const onKeyDown = (index: number, e: KeyboardEvent) => {
    if (!source) return
    const dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    const dy = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!dx && !dy) return
    e.preventDefault()
    const { width, height } = source.canvas
    const c = corners[index]
    moveCorner(index, {
      x: Math.max(0, Math.min(width, c.x + dx * width * KEY_STEP)),
      y: Math.max(0, Math.min(height, c.y + dy * height * KEY_STEP)),
    })
  }

  const apply = async () => {
    if (!source) return
    setBusy(true)
    setError('')
    try {
      // Cede un cuadro para que se pinte el estado "Enderezando..." antes del cálculo pesado.
      await new Promise((r) => setTimeout(r, 30))
      const straight = warpPerspective(source.canvas, corners)
      const canvas = modo === 'bn' ? binarizeDocument(straight) : straight
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.92))
      if (!blob) throw new Error()
      setResult({ canvas, url: URL.createObjectURL(blob) })
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'No se pudo enderezar el documento.')
    } finally {
      setBusy(false)
    }
  }

  const downloadJpg = () => {
    if (!result || !source) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = `${source.name}-escaneado.jpg`
    a.click()
  }

  const downloadPdf = async () => {
    if (!result || !source) return
    const blob = await new Promise<Blob | null>((r) => result.canvas.toBlob(r, 'image/jpeg', 0.92))
    if (!blob) return
    const pdf = await buildPdfFromImages([new File([blob], 'pagina.jpg', { type: 'image/jpeg' })])
    const url = URL.createObjectURL(pdf)
    const a = document.createElement('a')
    a.href = url
    a.download = `${source.name}-escaneado.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setSource(null)
    setResult(null)
    setError('')
  }

  return (
    <ToolShell
      title="Escanear documento"
      subtitle="Toma una foto de una hoja, ajusta sus esquinas y obtén un documento derecho en JPG o PDF."
    >
      {!source && (
        <div className="mt-8 space-y-4">
          <button type="button" onClick={() => cameraRef.current?.click()} className={BUTTON_PRIMARY}>
            <IconCamera size={18} />
            Tomar foto
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            aria-label="Tomar foto con la cámara"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          <FileDropzone
            accept="image/*"
            label="O arrastra una foto aquí o haz click para elegirla"
            hint="Foto de una hoja, factura o recibo. Se procesa en tu navegador."
            onFile={handleFile}
          />
        </div>
      )}

      {error && <ErrorNotice message={error} className="mt-6" />}

      {source && !result && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Arrastra los círculos hasta las esquinas de la hoja.
            </p>
            <div
              ref={frameRef}
              className="relative touch-none select-none overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
              onPointerMove={onPointerMove}
              onPointerUp={() => (dragging.current = null)}
              onPointerCancel={() => (dragging.current = null)}
            >
              <img src={source.url} alt="Foto del documento" className="block w-full" draggable={false} />
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${source.canvas.width} ${source.canvas.height}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon
                  points={corners.map((c) => `${c.x},${c.y}`).join(' ')}
                  className="fill-emerald-500/15 stroke-emerald-500"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {corners.map((c, i) => (
                <button
                  key={CORNER_LABELS[i]}
                  type="button"
                  aria-label={`${CORNER_LABELS[i]}: usa las flechas para moverla`}
                  onPointerDown={(e) => {
                    dragging.current = i
                    e.currentTarget.setPointerCapture(e.pointerId)
                  }}
                  onPointerMove={onPointerMove}
                  onPointerUp={() => (dragging.current = null)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  className={`absolute size-8 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-white bg-emerald-600 shadow-md pointer-coarse:size-11 active:cursor-grabbing ${FOCUS_RING}`}
                  style={{ left: `${(c.x / source.canvas.width) * 100}%`, top: `${(c.y / source.canvas.height) * 100}%` }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <SelectField label="Resultado" value={modo} onChange={setModo} options={MODOS} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={apply} disabled={busy} className={BUTTON_PRIMARY}>
                {busy && <IconLoader2 size={18} className="animate-spin" />}
                {busy ? 'Enderezando...' : 'Enderezar'}
              </button>
              <button type="button" onClick={reset} className={BUTTON_SECONDARY}>
                <IconRefresh size={18} />
                Otra foto
              </button>
            </div>
          </div>
        </div>
      )}

      {source && result && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <img
            src={result.url}
            alt="Documento escaneado"
            className="w-full rounded-lg border border-slate-200 bg-white dark:border-slate-800"
          />
          <div className="flex flex-wrap content-start gap-2">
            <button type="button" onClick={downloadJpg} className={BUTTON_PRIMARY}>
              <IconDownload size={18} />
              Descargar JPG
            </button>
            <button type="button" onClick={() => void downloadPdf()} className={BUTTON_SECONDARY}>
              <IconDownload size={18} />
              Descargar PDF
            </button>
            <button type="button" onClick={() => setResult(null)} className={BUTTON_SECONDARY}>
              Ajustar esquinas
            </button>
            <button type="button" onClick={reset} className={BUTTON_SECONDARY}>
              <IconRefresh size={18} />
              Otra foto
            </button>
          </div>
        </div>
      )}
    </ToolShell>
  )
}

export default EscanearDocumento

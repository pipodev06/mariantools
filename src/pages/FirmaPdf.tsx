import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { IconDownload, IconEraser, IconFileTypePdf, IconLoader2, IconSignature, IconUpload, IconX } from '@tabler/icons-react'
import { embedSignature, getPdfPageCount, type SignaturePosition } from '../lib/signature'
import { FOCUS_RING, BUTTON_PRIMARY, CHIP_SELECTED, CHIP_INACTIVE } from '../lib/ui'

const ACCEPTED_TYPE = 'application/pdf'
const ACCEPTED_EXT = '.pdf'

const POSITIONS: { key: SignaturePosition; label: string }[] = [
  { key: 'bottom-right', label: 'Abajo derecha' },
  { key: 'bottom-center', label: 'Abajo centro' },
  { key: 'bottom-left', label: 'Abajo izquierda' },
  { key: 'top-right', label: 'Arriba derecha' },
  { key: 'top-left', label: 'Arriba izquierda' },
  { key: 'center', label: 'Centro' },
]

const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 200

const FirmaPdf = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [pageNumber, setPageNumber] = useState(1)
  const [position, setPosition] = useState<SignaturePosition>('bottom-right')
  const [sigWidth, setSigWidth] = useState(150)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const uid = useId()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a'
  }, [])

  // Libera el PDF firmado al generar otro o al desmontar la página.
  useEffect(() => {
    if (!resultUrl) return
    return () => URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  const getPos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    }
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    isDrawing.current = true
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }
  const handlePointerUp = () => {
    isDrawing.current = false
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const addFile = async (incoming: FileList | File[]) => {
    const found = Array.from(incoming).find((f) => f.type === ACCEPTED_TYPE)
    if (!found) return
    setFile(found)
    const count = await getPdfPageCount(found)
    setPageCount(count)
    setPageNumber(1)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    addFile(e.dataTransfer.files)
  }
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFile(e.target.files)
    e.target.value = ''
  }

  const handleSign = async () => {
    const canvas = canvasRef.current
    if (!canvas || !file || !hasSignature) return
    setIsProcessing(true)
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const blob = await embedSignature(file, pageNumber - 1, dataUrl, position, sigWidth)
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } finally {
      setIsProcessing(false)
    }
  }

  const canSign = Boolean(file) && hasSignature

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Firma digital en PDF
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Dibuja tu firma y colócala sobre el documento, directo en tu navegador.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tu firma</p>
                <button
                  type="button"
                  onClick={clearSignature}
                  className={`inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
                >
                  <IconEraser size={14} />
                  Limpiar
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                aria-label="Lienzo para dibujar tu firma"
                onPointerLeave={handlePointerUp}
                className={`mt-2 w-full touch-none rounded-lg border border-dashed border-slate-500 bg-slate-50 dark:border-slate-500 dark:bg-slate-950 ${FOCUS_RING}`}
              />
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              className={`flex flex-1 min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${FOCUS_RING} ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                  : 'border-slate-500 bg-white hover:border-emerald-600 dark:border-slate-500 dark:bg-slate-900 dark:hover:border-emerald-400'
              }`}
            >
              {file ? (
                <div className="flex items-center gap-2">
                  <p className="max-w-64 truncate text-sm text-slate-800 dark:text-slate-100">{file.name}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setResultUrl(null)
                    }}
                    aria-label="Quitar archivo"
                    className={`cursor-pointer rounded-full bg-slate-800 p-1 text-white hover:bg-emerald-700 ${FOCUS_RING}`}
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <IconUpload
                    className={isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}
                    size={24}
                    stroke={1.5}
                  />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {isDragging ? 'Suelta el PDF aquí' : 'Arrastra tu PDF o haz click'}
                  </p>
                </>
              )}
              <input ref={inputRef} type="file" aria-label="Elegir PDF" accept={ACCEPTED_EXT} onChange={handleChange} className="hidden" />
            </div>

            {file && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`${uid}-pagina`} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Página ({pageCount} en total)
                    </label>
                    <input
                      id={`${uid}-pagina`}
                      type="number"
                      min={1}
                      max={pageCount}
                      value={pageNumber}
                      onChange={(e) => setPageNumber(Math.min(pageCount, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))}
                      className={`mt-1 w-full rounded-lg border border-slate-500 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 ${FOCUS_RING}`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-tamano`} className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tamaño</label>
                    <input
                      id={`${uid}-tamano`}
                      type="range"
                      min={80}
                      max={280}
                      value={sigWidth}
                      onChange={(e) => setSigWidth(Number(e.target.value))}
                      className={`mt-3 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Posición</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {POSITIONS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPosition(p.key)}
                        className={`cursor-pointer rounded-lg border px-2 py-2 text-xs transition-colors ${FOCUS_RING} ${
                          position === p.key
                            ? CHIP_SELECTED
                            : CHIP_INACTIVE
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canSign || isProcessing}
                  onClick={handleSign}
                  className={`mt-4 w-full justify-center ${BUTTON_PRIMARY}`}
                >
                  {isProcessing && <IconLoader2 size={18} className="animate-spin" />}
                  {isProcessing ? 'Firmando...' : 'Firmar PDF'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            {resultUrl ? (
              <>
                <IconFileTypePdf className="text-emerald-600 dark:text-emerald-400" size={56} stroke={1.5} />
                <p className="text-sm text-slate-500 dark:text-slate-400">PDF firmado y listo.</p>
                <a
                  href={resultUrl}
                  download={`firmado-${file?.name ?? 'documento.pdf'}`}
                  className={BUTTON_PRIMARY}
                >
                  <IconDownload size={18} />
                  Descargar PDF firmado
                </a>
              </>
            ) : (
              <>
                <IconSignature className="text-slate-400 dark:text-slate-600" aria-hidden="true" size={64} stroke={1.5} />
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Dibuja tu firma, sube un PDF y presiona "Firmar PDF"
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default FirmaPdf

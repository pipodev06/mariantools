import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import { IconDownload, IconFileTypePdf, IconLoader2, IconPhoto, IconRubberStamp, IconUpload, IconX } from '@tabler/icons-react'
import { watermarkImage, watermarkPdf } from '../lib/watermark'
import OtherTools from '../components/OtherTools'

type Mode = 'image' | 'pdf'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const IMAGE_EXT = '.jpg,.jpeg,.png,.webp'
const PDF_TYPE = 'application/pdf'
const PDF_EXT = '.pdf'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const MarcaDeAgua = () => {
  const [mode, setMode] = useState<Mode>('image')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('CONFIDENCIAL')
  const [color, setColor] = useState('#0f172a')
  const [opacity, setOpacity] = useState(35)
  const [fontSize, setFontSize] = useState(48)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const acceptedTypes = mode === 'image' ? IMAGE_TYPES : [PDF_TYPE]
  const acceptedExt = mode === 'image' ? IMAGE_EXT : PDF_EXT
  const resultUrlRef = useRef<string | null>(null)

  const switchMode = (next: Mode) => {
    setMode(next)
    setFile(null)
    setResultUrl(null)
  }

  useEffect(() => {
    if (!file || !text.trim()) return

    let cancelled = false
    const run = async () => {
      // yield un tick antes del primer setState — react-hooks/set-state-in-effect
      // solo permite setState dentro de callbacks async, no de forma síncrona
      // en el cuerpo del efecto.
      await Promise.resolve()
      if (cancelled) return
      setIsProcessing(true)
      try {
        const url =
          mode === 'image'
            ? await watermarkImage(file, text, color, opacity / 100, fontSize)
            : URL.createObjectURL(await watermarkPdf(file, text, color, opacity / 100, fontSize))
        if (cancelled) return
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
        resultUrlRef.current = url
        setResultUrl(url)
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [file, text, color, opacity, fontSize, mode])

  const addFile = (incoming: FileList | File[]) => {
    const found = Array.from(incoming).find((f) => acceptedTypes.includes(f.type))
    if (found) setFile(found)
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
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length) addFile(e.clipboardData.files)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Marca de agua
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Agrega una marca de agua de texto a tus imágenes o PDF, directo en tu navegador.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => switchMode('image')}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all ${FOCUS_RING} ${
              mode === 'image'
                ? 'border-emerald-600 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <IconPhoto className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={22} />
            <span>
              <span className="block font-semibold text-slate-800 dark:text-slate-100">Imagen</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">JPG, PNG o WebP</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('pdf')}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all ${FOCUS_RING} ${
              mode === 'pdf'
                ? 'border-emerald-600 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <IconFileTypePdf className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" size={22} />
            <span>
              <span className="block font-semibold text-slate-800 dark:text-slate-100">PDF</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">Todas las páginas</span>
            </span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Texto</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${FOCUS_RING}`}
              />
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={`mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 ${FOCUS_RING}`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Opacidad</label>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className={`mt-3 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tamaño</label>
                  <input
                    type="range"
                    min={16}
                    max={96}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className={`mt-3 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                  />
                </div>
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              className={`flex flex-1 min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${FOCUS_RING} ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                  : 'border-slate-300 bg-white hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400'
              }`}
            >
              {file ? (
                <div className="relative flex items-center gap-2">
                  <p className="max-w-64 truncate text-sm text-slate-800 dark:text-slate-100">{file.name}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setResultUrl(null)
                    }}
                    className={`cursor-pointer rounded-full bg-slate-800 p-1 text-white hover:bg-emerald-600 ${FOCUS_RING}`}
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <IconUpload
                    className={isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}
                    size={28}
                    stroke={1.5}
                  />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {isDragging ? 'Suelta el archivo aquí' : `Arrastra tu ${mode === 'image' ? 'imagen' : 'PDF'} o haz click`}
                  </p>
                </>
              )}
              <input ref={inputRef} type="file" accept={acceptedExt} onChange={handleChange} className="hidden" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-6 lg:h-104 dark:border-slate-800 dark:bg-slate-900">
            {isProcessing ? (
              <IconLoader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={40} />
            ) : resultUrl ? (
              mode === 'image' ? (
                <>
                  <img src={resultUrl} alt="Resultado con marca de agua" className="max-h-72 w-auto max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-800" />
                  <a
                    href={resultUrl}
                    download={`marca-de-agua-${file?.name ?? 'imagen.png'}`}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 ${FOCUS_RING}`}
                  >
                    <IconDownload size={18} />
                    Descargar
                  </a>
                </>
              ) : (
                <>
                  <IconFileTypePdf className="text-emerald-600 dark:text-emerald-400" size={56} stroke={1.5} />
                  <p className="text-sm text-slate-500 dark:text-slate-400">PDF listo con la marca de agua.</p>
                  <a
                    href={resultUrl}
                    download={`marca-de-agua-${file?.name ?? 'documento.pdf'}`}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 ${FOCUS_RING}`}
                  >
                    <IconDownload size={18} />
                    Descargar PDF
                  </a>
                </>
              )
            ) : (
              <>
                <IconRubberStamp className="text-slate-300 dark:text-slate-700" size={64} stroke={1.5} />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sube un archivo para ver el resultado
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      <OtherTools currentHref="/marca-de-agua" />
    </>
  )
}

export default MarcaDeAgua

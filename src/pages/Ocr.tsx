import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import {
  IconBolt,
  IconCheck,
  IconCopy,
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconSwitchHorizontal,
  IconUpload,
  IconWand,
  IconX,
} from '@tabler/icons-react'
import {
  createOcrWorker,
  mapWithConcurrency,
  recognizeWithAi,
  recognizeWithTesseract,
} from '../lib/ocr'
import PreviewModal, { type PreviewImage } from '../components/PreviewModal'
import { FOCUS_RING, BUTTON_PRIMARY, BUTTON_SECONDARY, BADGE } from '../lib/ui'

const AI_CONCURRENCY = 3

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

type Engine = 'fast' | 'ai'

type PendingFile = {
  file: File
  previewUrl: string
}

type FileResult = {
  file: File
  previewUrl: string
  text: string
  confidence: number
  engine: Engine
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const CONFIDENCE_LEVELS = {
  high: { label: 'Confianza alta', className: BADGE.emerald },
  medium: { label: 'Confianza media', className: BADGE.amber },
  low: { label: 'Confianza baja', className: BADGE.red },
} as const

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 80) return CONFIDENCE_LEVELS.high
  if (confidence >= 50) return CONFIDENCE_LEVELS.medium
  return CONFIDENCE_LEVELS.low
}

const Ocr = () => {
  const [engine, setEngine] = useState<Engine>('fast')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [results, setResults] = useState<FileResult[] | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [retryingIndex, setRetryingIndex] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  // Todas las URLs de vista previa creadas; se revocan al desmontar (revocar dos veces es inofensivo).
  const urlsRef = useRef<string[]>([])

  useEffect(() => {
    const urls = urlsRef.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming)
      .filter((file) => ACCEPTED_TYPES.includes(file.type))
      .map((file) => {
        const previewUrl = URL.createObjectURL(file)
        urlsRef.current.push(previewUrl)
        return { file, previewUrl }
      })
    setFiles((prev) => [...prev, ...valid])
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
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
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length) addFiles(e.clipboardData.files)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const target = prev[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleConvert = async () => {
    setIsConverting(true)
    setProgress({ done: 0, total: files.length })

    try {
      if (engine === 'fast') {
        const worker = await createOcrWorker()
        try {
          const newResults: FileResult[] = []
          for (const { file, previewUrl } of files) {
            const { text, confidence } = await recognizeWithTesseract(worker, file)
            newResults.push({ file, previewUrl, text, confidence, engine: 'fast' })
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          }
          setResults(newResults)
        } finally {
          await worker.terminate()
        }
      } else {
        const newResults = await mapWithConcurrency(files, AI_CONCURRENCY, async ({ file, previewUrl }) => {
          let text: string
          let confidence = 100
          try {
            const result = await recognizeWithAi(file)
            text = result.text
            confidence = result.confidence
          } catch (error) {
            text = error instanceof Error ? `[Error] ${error.message}` : '[Error desconocido]'
          }
          setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          return { file, previewUrl, text, confidence, engine: 'ai' as const }
        })
        setResults(newResults)
      }
    } finally {
      setIsConverting(false)
    }
  }

  const handleReset = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setResults(null)
    setFiles([])
  }

  const updateResultText = (index: number, text: string) => {
    setResults((prev) => prev && prev.map((r, i) => (i === index ? { ...r, text } : r)))
  }

  const copyText = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500)
  }

  const downloadText = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/\.[^.]+$/, '')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const combineResultsText = (items: FileResult[]) =>
    items.map((r) => `--- ${r.file.name} ---\n${r.text}`).join('\n\n')

  const copyAllText = async () => {
    if (!results) return
    await navigator.clipboard.writeText(combineResultsText(results))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  const downloadAllText = () => {
    if (!results) return
    downloadText('textos-reconocidos', combineResultsText(results))
  }

  const retryResult = async (index: number) => {
    const target = results?.[index]
    if (!target) return

    const nextEngine: Engine = target.engine === 'fast' ? 'ai' : 'fast'
    setRetryingIndex(index)

    try {
      let text: string
      let confidence: number

      if (nextEngine === 'fast') {
        const worker = await createOcrWorker()
        try {
          const result = await recognizeWithTesseract(worker, target.file)
          text = result.text
          confidence = result.confidence
        } finally {
          await worker.terminate()
        }
      } else {
        const result = await recognizeWithAi(target.file)
        text = result.text
        confidence = result.confidence
      }

      setResults(
        (prev) =>
          prev &&
          prev.map((r, i) => (i === index ? { ...r, text, confidence, engine: nextEngine } : r)),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      setResults(
        (prev) => prev && prev.map((r, i) => (i === index ? { ...r, text: `[Error] ${message}` } : r)),
      )
    } finally {
      setRetryingIndex(null)
    }
  }

  return (
    <>
    <section
      className={`mx-auto px-6 py-16 ${files.length > 0 ? 'max-w-[90rem]' : 'max-w-7xl'}`}
    >
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
        Imagen a texto
      </h1>
      <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
        Extrae el texto de tus imágenes con OCR rápido o con IA. Soporta varios archivos a la vez.
      </p>

      {!results && (
        <>
          <div
            className={`mt-8 grid grid-cols-1 gap-6 ${
              files.length > 0 ? 'lg:grid-cols-2' : ''
            }`}
          >
            <div className={`flex flex-col gap-4 ${files.length > 0 ? 'lg:h-104' : ''}`}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEngine('fast')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all ${FOCUS_RING} ${
                    engine === 'fast'
                      ? 'border-emerald-600 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <IconBolt
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    size={22}
                  />
                  <span>
                    <span className="block font-semibold text-slate-800 dark:text-slate-100">
                      Rápido
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      Corre en tu navegador, sin subir nada
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEngine('ai')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all ${FOCUS_RING} ${
                    engine === 'ai'
                      ? 'border-emerald-600 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <IconWand
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    size={22}
                  />
                  <span>
                    <span className="block font-semibold text-slate-800 dark:text-slate-100">
                      Con IA
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      Entiende columnas y gráficos
                    </span>
                  </span>
                </button>
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
                className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${FOCUS_RING} ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                    : 'border-slate-500 bg-white hover:border-emerald-600 dark:border-slate-500 dark:bg-slate-900 dark:hover:border-emerald-400'
                }`}
              >
                <IconUpload
                  className={`transition-colors ${
                    isDragging
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  size={32}
                  stroke={1.5}
                />
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {isDragging
                    ? 'Suelta las imágenes aquí'
                    : 'Arrastra tus imágenes aquí o haz click para elegirlas'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  También puedes pegarlas con Ctrl+V. Formatos: JPG, PNG, WebP.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  aria-label="Elegir imágenes"
                  accept={ACCEPTED_EXT}
                  multiple
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:h-104">
                <ul className="max-h-80 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                  {files.map(({ file, previewUrl }, i) => (
                    <li
                      key={previewUrl}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: previewUrl, name: file.name })}
                        className={`shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 ${FOCUS_RING}`}
                      >
                        <img src={previewUrl} alt={file.name} className="h-10 w-10 object-cover" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-slate-800 dark:text-slate-100">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label={`Quitar ${file.name}`}
                        className={`shrink-0 cursor-pointer rounded text-slate-500 hover:text-emerald-700 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        <IconX size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={files.length === 0 || isConverting}
            onClick={handleConvert}
            className={`mt-6 ${BUTTON_PRIMARY}`}
          >
            {isConverting && <IconLoader2 size={18} className="animate-spin" />}
            {isConverting
              ? `Reconociendo texto (${progress.done}/${progress.total})...`
              : 'Convertir'}
          </button>
        </>
      )}

      {results && (
        <div className="mt-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              className={BUTTON_SECONDARY}
            >
              <IconRefresh size={18} />
              Volver a empezar
            </button>
            <button
              type="button"
              onClick={copyAllText}
              className={BUTTON_SECONDARY}
            >
              {copiedAll ? <IconCheck size={18} /> : <IconCopy size={18} />}
              Copiar todo
            </button>
            <button
              type="button"
              onClick={downloadAllText}
              className={BUTTON_SECONDARY}
            >
              <IconDownload size={18} />
              Descargar todo
            </button>
          </div>

          <div className="space-y-6">
            {results.map((result, i) => {
              const confidenceLevel = getConfidenceLevel(result.confidence)
              return (
              <div
                key={result.previewUrl}
                className="rounded-xl border border-slate-200 bg-white p-5 motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.4s_ease-out_forwards] dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({ url: result.previewUrl, name: result.file.name })
                    }
                    className={`shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 ${FOCUS_RING}`}
                  >
                    <img
                      src={result.previewUrl}
                      alt={result.file.name}
                      className="h-14 w-14 object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">
                      {result.file.name}
                    </h3>
                    {result.engine === 'fast' && (
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${confidenceLevel.className}`}
                      >
                        {confidenceLevel.label}
                      </span>
                    )}
                  </div>
                  <div className="ml-auto flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => retryResult(i)}
                      disabled={retryingIndex === i}
                      aria-label={
                        result.engine === 'fast' ? 'Reintentar con IA' : 'Reintentar con Rápido'
                      }
                      title={
                        result.engine === 'fast' ? 'Reintentar con IA' : 'Reintentar con Rápido'
                      }
                      className={`cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                    >
                      {retryingIndex === i ? (
                        <IconLoader2 size={18} className="animate-spin" />
                      ) : (
                        <IconSwitchHorizontal size={18} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(result.text, i)}
                      aria-label={`Copiar texto de ${result.file.name}`}
                      className={`cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                    >
                      {copiedIndex === i ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadText(result.file.name, result.text)}
                      aria-label={`Descargar texto de ${result.file.name}`}
                      className={`cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                    >
                      <IconDownload size={18} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={result.text}
                  onChange={(e) => updateResultText(i, e.target.value)}
                  placeholder="El texto reconocido va a aparecer aquí..."
                  aria-label={`Texto reconocido de ${result.file.name}`}
                  rows={6}
                  className={`mt-3 w-full rounded-lg border border-slate-500 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100 ${FOCUS_RING}`}
                />
              </div>
              )
            })}
          </div>
        </div>
      )}

      <PreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </section>
    </>
  )
}

export default Ocr

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type ReactNode } from 'react'
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import { mapWithConcurrency } from '../lib/ocr'
import PreviewModal, { type PreviewImage } from './PreviewModal'
import OtherTools from './OtherTools'

const AI_CONCURRENCY = 3
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const SECONDARY_BUTTON = `inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`

type PendingFile = { file: File; previewUrl: string }

type FileResult<T> = {
  file: File
  previewUrl: string
  value?: T
  error?: string
}

type Props<T> = {
  currentHref: string
  title: string
  subtitle: string
  actionLabel: string
  busyLabel: string
  run: (file: File) => Promise<T>
  /** Texto plano de un resultado: lo que se copia y se descarga. */
  toText: (value: T) => string
  downloadExt: 'txt' | 'csv'
  renderResult?: (value: T) => ReactNode
  /** Controles extra (ej. selector de idioma) junto al botón de acción. */
  controls?: ReactNode
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ImageAiTool = <T,>({
  currentHref,
  title,
  subtitle,
  actionLabel,
  busyLabel,
  run,
  toText,
  downloadExt,
  renderResult,
  controls,
}: Props<T>) => {
  const [files, setFiles] = useState<PendingFile[]>([])
  const [results, setResults] = useState<FileResult<T>[] | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming)
      .filter((file) => ACCEPTED_TYPES.includes(file.type))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
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

  const handleRun = async () => {
    setIsRunning(true)
    setProgress({ done: 0, total: files.length })

    try {
      const newResults = await mapWithConcurrency(
        files,
        AI_CONCURRENCY,
        async ({ file, previewUrl }): Promise<FileResult<T>> => {
          let value: T | undefined
          let error: string | undefined
          try {
            value = await run(file)
          } catch (err) {
            error = err instanceof Error ? err.message : 'Error desconocido'
          }
          setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          return { file, previewUrl, value, error }
        },
      )
      setResults(newResults)
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setResults(null)
    setFiles([])
  }

  const copyResult = async (value: T, index: number) => {
    await navigator.clipboard.writeText(toText(value))
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500)
  }

  const downloadResult = (result: FileResult<T>) => {
    if (result.value === undefined) return
    const mime = downloadExt === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'
    // BOM en CSV para que Excel lea bien las tildes.
    const content = (downloadExt === 'csv' ? '﻿' : '') + toText(result.value)
    const url = URL.createObjectURL(new Blob([content], { type: mime }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.file.name.replace(/\.[^.]+$/, '')}.${downloadExt}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <section
        className={`mx-auto px-6 py-16 ${files.length > 0 ? 'max-w-[90rem]' : 'max-w-7xl'}`}
      >
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>

        {!results && (
          <>
            <div
              className={`mt-8 grid grid-cols-1 gap-6 ${files.length > 0 ? 'lg:grid-cols-2' : ''}`}
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
                }}
                role="button"
                tabIndex={0}
                className={`flex min-h-72 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${FOCUS_RING} ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                    : 'border-slate-300 bg-white hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400'
                }`}
              >
                <IconUpload
                  className={
                    isDragging
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }
                  size={32}
                  stroke={1.5}
                />
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {isDragging
                    ? 'Suelta las imágenes aquí'
                    : 'Arrastra tus imágenes aquí o haz click para elegirlas'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  También puedes pegarlas con Ctrl+V. Formatos: JPG, PNG, WebP. Se envían a IA para
                  procesarse.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_EXT}
                  multiple
                  onChange={handleChange}
                  className="hidden"
                />
              </div>

              {files.length > 0 && (
                <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:h-104">
                  <ul className="max-h-80 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                    {files.map(({ file, previewUrl }, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: previewUrl, name: file.name })}
                          aria-label={`Ver ${file.name}`}
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
                          className={`shrink-0 cursor-pointer rounded p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 ${FOCUS_RING}`}
                        >
                          <IconX size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {controls}
              <button
                type="button"
                disabled={files.length === 0 || isRunning}
                onClick={handleRun}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 ${FOCUS_RING}`}
              >
                {isRunning && <IconLoader2 size={18} className="animate-spin" />}
                <span role="status">
                  {isRunning ? `${busyLabel} (${progress.done}/${progress.total})...` : actionLabel}
                </span>
              </button>
            </div>
          </>
        )}

        {results && (
          <div className="mt-8">
            <div className="mb-6 flex flex-wrap gap-2">
              <button type="button" onClick={handleReset} className={SECONDARY_BUTTON}>
                <IconRefresh size={18} />
                Volver a empezar
              </button>
            </div>

            <div className="space-y-6">
              {results.map((result, i) => (
                <div
                  key={`${result.file.name}-${i}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.4s_ease-out_forwards] dark:border-slate-800 dark:bg-slate-900"
                  style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({ url: result.previewUrl, name: result.file.name })
                      }
                      aria-label={`Ver ${result.file.name}`}
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
                      {result.error && (
                        <span
                          role="alert"
                          className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300"
                        >
                          {result.error}
                        </span>
                      )}
                    </div>
                    {result.value !== undefined && (
                      <div className="ml-auto flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => copyResult(result.value as T, i)}
                          aria-label="Copiar resultado"
                          className={`cursor-pointer rounded-lg border border-slate-200 p-2.5 text-slate-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                        >
                          {copiedIndex === i ? <IconCheck size={18} /> : <IconCopy size={18} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadResult(result)}
                          aria-label="Descargar resultado"
                          className={`cursor-pointer rounded-lg border border-slate-200 p-2.5 text-slate-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                        >
                          <IconDownload size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {result.value !== undefined && (
                    <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                      {renderResult ? (
                        renderResult(result.value)
                      ) : (
                        <p className="break-words whitespace-pre-wrap">{toText(result.value)}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <PreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      </section>
      <OtherTools currentHref={currentHref} />
    </>
  )
}

export default ImageAiTool

import { useEffect, useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import ErrorNotice from '../components/ErrorNotice'
import { IconDownload, IconLoader2, IconRefresh, IconUpload, IconX } from '@tabler/icons-react'
import {
  compressToTarget,
  convertImage,
  FORMAT_EXT,
  FORMAT_LABELS,
  type ImageFormat,
} from '../lib/imageConvert'
import { NumberField } from '../components/FormFields'
import PreviewModal, { type PreviewImage } from '../components/PreviewModal'
import { FOCUS_RING, BUTTON_PRIMARY, BUTTON_SECONDARY_BASE, BUTTON_SECONDARY, CHIP_ACTIVE, CHIP_INACTIVE } from '../lib/ui'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'
const FORMATS: ImageFormat[] = ['image/jpeg', 'image/webp', 'image/png']

type PendingFile = { file: File; previewUrl: string }
type ConvertResult = {
  file: File
  previewUrl: string
  outputUrl: string
  outputSize: number
  outputName: string
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ComprimirImagen = () => {
  const [files, setFiles] = useState<PendingFile[]>([])
  const [format, setFormat] = useState<ImageFormat>('image/jpeg')
  const [quality, setQuality] = useState(80)
  const [maxKb, setMaxKb] = useState('')
  const [results, setResults] = useState<ConvertResult[] | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const uid = useId()
  // Todas las URLs creadas; se revocan al desmontar (revocar dos veces es inofensivo).
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

  const targetBytes = Math.round(Number(maxKb) * 1024)
  const hasTarget = format !== 'image/png' && targetBytes > 0

  const handleConvert = async () => {
    setIsConverting(true)
    setError('')
    try {
      const newResults: ConvertResult[] = []
      for (const { file, previewUrl } of files) {
        const { blob, previewUrl: outputUrl } = hasTarget
          ? await compressToTarget(file, format as Exclude<ImageFormat, 'image/png'>, targetBytes)
          : await convertImage(file, format, quality)
        urlsRef.current.push(outputUrl)
        newResults.push({
          file,
          previewUrl,
          outputUrl,
          outputSize: blob.size,
          outputName: `${file.name.replace(/\.[^.]+$/, '')}.${FORMAT_EXT[format]}`,
        })
      }
      setResults(newResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsConverting(false)
    }
  }

  const handleReset = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    results?.forEach((r) => URL.revokeObjectURL(r.outputUrl))
    setResults(null)
    setFiles([])
  }

  const downloadAll = () => {
    results?.forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = r.outputUrl
        a.download = r.outputName
        a.click()
      }, i * 200)
    })
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Comprimir/convertir imagen
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Reduce el peso o cambia de formato entre JPG, PNG y WebP, directo en tu navegador.
        </p>

        {!results && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Formato de salida
                    </p>
                  </div>
                  <div className="mt-2 inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
                    {FORMATS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFormat(f)}
                        className={`cursor-pointer rounded-md px-4 py-1.5 text-sm transition-colors ${FOCUS_RING} ${
                          format === f
                            ? CHIP_ACTIVE
                            : CHIP_INACTIVE
                        }`}
                      >
                        {FORMAT_LABELS[f]}
                      </button>
                    ))}
                  </div>

                  {format !== 'image/png' && (
                    <div className="mt-4 space-y-4">
                      <NumberField label="Peso máximo en KB (opcional)" value={maxKb} onChange={setMaxKb} step={1} />
                      {!hasTarget && (
                        <div>
                          <div className="flex items-center justify-between">
                            <label htmlFor={`${uid}-calidad`} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              Calidad
                            </label>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{quality}%</span>
                          </div>
                          <input
                            id={`${uid}-calidad`}
                            type="range"
                            min={10}
                            max={100}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className={`mt-2 w-full cursor-pointer accent-emerald-600 ${FOCUS_RING}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
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
                  className={`flex flex-1 min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${FOCUS_RING} ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                      : 'border-slate-500 bg-white hover:border-emerald-600 dark:border-slate-500 dark:bg-slate-900 dark:hover:border-emerald-400'
                  }`}
                >
                  <IconUpload
                    className={isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}
                    size={32}
                    stroke={1.5}
                  />
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {isDragging ? 'Suelta las imágenes aquí' : 'Arrastra tus imágenes aquí o haz click para elegirlas'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    También puedes pegarlas con Ctrl+V. Formatos: JPG, PNG, WebP.
                  </p>
                  <input ref={inputRef} type="file" aria-label="Elegir imágenes" accept={ACCEPTED_EXT} multiple onChange={handleChange} className="hidden" />
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
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          aria-label={`Quitar ${file.name}`}
                          className={`shrink-0 cursor-pointer rounded text-slate-500 hover:text-emerald-600 dark:text-slate-400 ${FOCUS_RING}`}
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
              {isConverting ? 'Convirtiendo...' : 'Convertir'}
            </button>
            {error && (
              <ErrorNotice message={error} className="ml-3 mt-6" />
            )}
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
                onClick={downloadAll}
                className={BUTTON_SECONDARY}
              >
                <IconDownload size={18} />
                Descargar todo
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((r, i) => {
                const reduction = Math.round((1 - r.outputSize / r.file.size) * 100)
                return (
                  <div
                    key={r.outputUrl}
                    className="rounded-xl border border-slate-200 bg-white p-3 motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.4s_ease-out_forwards] dark:border-slate-800 dark:bg-slate-900"
                    style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: r.outputUrl, name: r.outputName })}
                      className={`block aspect-square w-full cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 ${FOCUS_RING}`}
                    >
                      <img src={r.outputUrl} alt={r.outputName} className="h-full w-full object-cover" />
                    </button>
                    <p className="mt-2 truncate text-xs text-slate-800 dark:text-slate-100">{r.outputName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(r.file.size)} → {formatFileSize(r.outputSize)}
                      {reduction > 0 && <span className="text-emerald-800 dark:text-emerald-400"> (-{reduction}%)</span>}
                    </p>
                    <a
                      href={r.outputUrl}
                      download={r.outputName}
                      className={`mt-2 w-full justify-center ${BUTTON_SECONDARY_BASE} py-1.5 text-xs`}
                    >
                      <IconDownload size={14} />
                      Descargar
                    </a>
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

export default ComprimirImagen

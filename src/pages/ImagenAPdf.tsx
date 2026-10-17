import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import { IconArrowDown, IconArrowUp, IconDownload, IconFileTypePdf, IconLoader2, IconRefresh, IconUpload, IconX } from '@tabler/icons-react'
import { buildPdfFromImages } from '../lib/imageToPdf'
import PreviewModal, { type PreviewImage } from '../components/PreviewModal'
import { FOCUS_RING, BUTTON_PRIMARY_BASE, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../lib/ui'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

type PendingFile = { file: File; previewUrl: string }

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ImagenAPdf = () => {
  const [files, setFiles] = useState<PendingFile[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  // Todas las URLs de vista previa creadas; se revocan al desmontar (revocar dos veces es inofensivo).
  const urlsRef = useRef<string[]>([])

  useEffect(() => {
    const urls = urlsRef.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  // Libera el PDF generado al reemplazarlo, reiniciar o desmontar la página.
  useEffect(() => {
    if (!resultUrl) return
    return () => URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

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
  const moveFile = (index: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleConvert = async () => {
    setIsConverting(true)
    try {
      const blob = await buildPdfFromImages(files.map((f) => f.file))
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } finally {
      setIsConverting(false)
    }
  }

  const handleReset = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setResultUrl(null)
    setFiles([])
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Imagen a PDF
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Junta una o varias imágenes en un solo PDF, directo en tu navegador.
        </p>

        {!resultUrl && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                className={`flex min-h-72 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${FOCUS_RING} ${
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
                  El orden de la lista es el orden de las páginas. Formatos: JPG, PNG, WebP.
                </p>
                <input ref={inputRef} type="file" aria-label="Elegir imágenes" accept={ACCEPTED_EXT} multiple onChange={handleChange} className="hidden" />
              </div>

              {files.length > 0 && (
                <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:h-72">
                  <ul className="max-h-80 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                    {files.map(({ file, previewUrl }, i) => (
                      <li
                        key={previewUrl}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {i + 1}
                        </span>
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
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moveFile(i, -1)}
                            aria-label={`Subir ${file.name}`}
                            className={`cursor-pointer rounded text-slate-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 ${FOCUS_RING}`}
                          >
                            <IconArrowUp size={18} />
                          </button>
                          <button
                            type="button"
                            disabled={i === files.length - 1}
                            onClick={() => moveFile(i, 1)}
                            aria-label={`Bajar ${file.name}`}
                            className={`cursor-pointer rounded text-slate-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 ${FOCUS_RING}`}
                          >
                            <IconArrowDown size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            aria-label={`Quitar ${file.name}`}
                            className={`cursor-pointer rounded text-slate-500 hover:text-emerald-700 dark:text-slate-400 ${FOCUS_RING}`}
                          >
                            <IconX size={18} />
                          </button>
                        </div>
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
              {isConverting ? 'Generando PDF...' : 'Convertir'}
            </button>
          </>
        )}

        {resultUrl && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <IconFileTypePdf className="text-emerald-600 dark:text-emerald-400" size={56} stroke={1.5} />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              PDF generado con {files.length} {files.length === 1 ? 'página' : 'páginas'}.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className={BUTTON_SECONDARY}
              >
                <IconRefresh size={18} />
                Volver a empezar
              </button>
              <a
                href={resultUrl}
                download="imagenes.pdf"
                className={`${BUTTON_PRIMARY_BASE} px-6 py-2 text-sm`}
              >
                <IconDownload size={18} />
                Descargar PDF
              </a>
            </div>
          </div>
        )}

        <PreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      </section>
    </>
  )
}

export default ImagenAPdf

import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconLoader2,
  IconPhotoCode,
  IconPhotoDown,
  IconPhotoOff,
  IconRefresh,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import {
  estimateBytesFromBase64,
  fileToDataUrl,
  mimeToExtension,
  parseBase64Entry,
} from '../lib/base64'
import PreviewModal, { type PreviewImage } from '../components/PreviewModal'
import { FOCUS_RING, BUTTON_PRIMARY, BUTTON_SECONDARY, CHIP_ACTIVE, CHIP_INACTIVE } from '../lib/ui'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp,.gif,.svg'

const CAN_COPY_IMAGE = typeof window !== 'undefined' && 'ClipboardItem' in window

type Mode = 'encode' | 'decode'
type OutputFormat = 'dataurl' | 'raw'

type PendingFile = {
  file: File
  previewUrl: string
}

type EncodeResult = {
  file: File
  previewUrl: string
  mime: string
  base64: string
}

type DecodeResult = {
  id: number
  raw: string
  dataUrl: string
  mime: string
  bytes: number
  error?: string
}

type Results = { mode: 'encode'; items: EncodeResult[] } | { mode: 'decode'; items: DecodeResult[] }

const GLASS_CARD =
  'rounded-xl border border-white/40 bg-white/60 shadow-sm backdrop-blur-md dark:border-slate-700/40 dark:bg-slate-800/40'

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl)
  if (!response.ok) throw new Error('No se pudo leer la imagen')
  return response.blob()
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getEncodedText = (item: EncodeResult, format: OutputFormat) =>
  format === 'dataurl' ? `data:${item.mime};base64,${item.base64}` : item.base64

const ImagenABase64 = () => {
  const [mode, setMode] = useState<Mode>('encode')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('dataurl')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [decodeInput, setDecodeInput] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  // Todas las URLs de vista previa creadas; se revocan al desmontar (revocar dos veces es inofensivo).
  const urlsRef = useRef<string[]>([])

  useEffect(() => {
    const urls = urlsRef.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const switchMode = (next: Mode) => {
    if (next === mode) return
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setMode(next)
    setFiles([])
    setDecodeInput('')
    setResults(null)
  }

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
    try {
      if (mode === 'encode') {
        const items: EncodeResult[] = []
        for (const { file, previewUrl } of files) {
          const dataUrl = await fileToDataUrl(file)
          items.push({
            file,
            previewUrl,
            mime: file.type || 'image/png',
            base64: dataUrl.split(',')[1] ?? '',
          })
        }
        setResults({ mode: 'encode', items })
      } else {
        const lines = decodeInput
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !/^-{2,}.*-{2,}$/.test(line))

        const items: DecodeResult[] = lines.map((raw, id) => {
          try {
            const { dataUrl, mime, base64 } = parseBase64Entry(raw)
            return { id, raw, dataUrl, mime, bytes: estimateBytesFromBase64(base64) }
          } catch {
            return { id, raw, dataUrl: '', mime: '', bytes: 0, error: 'Base64 inválido' }
          }
        })
        setResults({ mode: 'decode', items })
      }
    } finally {
      setIsConverting(false)
    }
  }

  const handleReset = () => {
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setResults(null)
    setFiles([])
    setDecodeInput('')
  }

  const copyText = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500)
  }

  const downloadTextFile = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const combineEncodedText = (items: EncodeResult[]) =>
    items.map((item) => `--- ${item.file.name} ---\n${getEncodedText(item, outputFormat)}`).join('\n\n')

  const copyAllText = async () => {
    if (!results || results.mode !== 'encode') return
    await navigator.clipboard.writeText(combineEncodedText(results.items))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  const downloadAllText = () => {
    if (!results || results.mode !== 'encode') return
    downloadTextFile('imagenes-base64.txt', combineEncodedText(results.items))
  }

  const downloadImage = async (item: DecodeResult, index: number) => {
    const blob = await dataUrlToBlob(item.dataUrl)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `imagen-${index + 1}.${mimeToExtension(item.mime)}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyImage = async (item: DecodeResult, index: number) => {
    const blob = await dataUrlToBlob(item.dataUrl)
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500)
  }

  const isWide = files.length > 0 || results !== null
  const canConvert =
    mode === 'encode' ? files.length > 0 : decodeInput.trim().length > 0

  return (
    <>
    <section className={`mx-auto px-6 py-16 ${isWide ? 'max-w-[90rem]' : 'max-w-7xl'}`}>
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
        Imagen a Base64
      </h1>
      <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
        Convierte imágenes a base64, o decodifica base64 de vuelta a imagen.
      </p>

      {!results && (
        <div className="relative mt-8">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-linear-to-br from-emerald-200/40 via-transparent to-slate-200/40 dark:from-emerald-500/10 dark:via-transparent dark:to-slate-800/20" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => switchMode('encode')}
              className={`flex cursor-pointer items-start gap-3 p-4 text-left transition-all ${FOCUS_RING} ${
                mode === 'encode'
                  ? 'rounded-xl border border-emerald-600 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/10'
                  : `${GLASS_CARD} hover:border-white/60 dark:hover:border-slate-700/60`
              }`}
            >
              <IconPhotoCode
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                size={22}
              />
              <span>
                <span className="block font-semibold text-slate-800 dark:text-slate-100">
                  Codificar
                </span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  Imagen → base64
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('decode')}
              className={`flex cursor-pointer items-start gap-3 p-4 text-left transition-all ${FOCUS_RING} ${
                mode === 'decode'
                  ? 'rounded-xl border border-emerald-600 bg-emerald-50 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/10'
                  : `${GLASS_CARD} hover:border-white/60 dark:hover:border-slate-700/60`
              }`}
            >
              <IconPhotoDown
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                size={22}
              />
              <span>
                <span className="block font-semibold text-slate-800 dark:text-slate-100">
                  Decodificar
                </span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  Base64 → imagen
                </span>
              </span>
            </button>
          </div>

          {mode === 'encode' ? (
            <div
              className={`mt-6 grid grid-cols-1 gap-6 ${files.length > 0 ? 'lg:grid-cols-2' : ''}`}
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center backdrop-blur-md transition-colors ${FOCUS_RING} ${
                  files.length > 0 ? 'lg:h-104' : ''
                } ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                    : 'border-slate-500 bg-white/60 hover:border-emerald-600 dark:border-slate-500 dark:bg-slate-800/40 dark:hover:border-emerald-400'
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
                  También puedes pegarlas con Ctrl+V. Formatos: JPG, PNG, WebP, GIF, SVG.
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

              {files.length > 0 && (
                <div className={`flex flex-col overflow-hidden ${GLASS_CARD} lg:h-104`}>
                  <ul className="max-h-80 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                    {files.map(({ file, previewUrl }, i) => (
                      <li
                        key={previewUrl}
                        className="flex items-center gap-3 rounded-lg border border-white/40 bg-white/50 px-3 py-2 text-sm dark:border-slate-700/40 dark:bg-slate-900/40"
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: previewUrl, name: file.name })}
                          className={`shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 ${FOCUS_RING}`}
                        >
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="h-10 w-10 object-cover"
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-slate-800 dark:text-slate-100">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatFileSize(file.size)}
                          </p>
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
          ) : (
            <textarea
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder="Pega uno o más base64 o data URLs — uno por línea"
              aria-label="Base64 o data URLs a decodificar"
              rows={10}
              className={`mt-6 w-full p-4 text-sm break-all text-slate-800 dark:text-slate-100 ${GLASS_CARD} ${FOCUS_RING}`}
            />
          )}

          <button
            type="button"
            disabled={!canConvert || isConverting}
            onClick={handleConvert}
            className={`mt-6 ${BUTTON_PRIMARY}`}
          >
            {isConverting && <IconLoader2 size={18} className="animate-spin" />}
            {isConverting ? 'Convirtiendo...' : 'Convertir'}
          </button>
        </div>
      )}

      {results && (
        <div className="relative mt-8">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-linear-to-br from-emerald-200/40 via-transparent to-slate-200/40 dark:from-emerald-500/10 dark:via-transparent dark:to-slate-800/20" />

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className={BUTTON_SECONDARY}
            >
              <IconRefresh size={18} />
              Volver a empezar
            </button>

            {results.mode === 'encode' && (
              <>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
                  {(['dataurl', 'raw'] as const).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setOutputFormat(format)}
                      className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
                        outputFormat === format
                          ? CHIP_ACTIVE
                          : CHIP_INACTIVE
                      }`}
                    >
                      {format === 'dataurl' ? 'Data URL' : 'Base64 puro'}
                    </button>
                  ))}
                </div>
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
              </>
            )}
          </div>

          {results.mode === 'encode' ? (
            <div className="space-y-6">
              {results.items.map((item, i) => (
                <div
                  key={item.previewUrl}
                  className={`p-5 motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.4s_ease-out_forwards] ${GLASS_CARD}`}
                  style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({ url: item.previewUrl, name: item.file.name })
                      }
                      className={`shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/40 dark:border-slate-700/40 ${FOCUS_RING}`}
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-14 w-14 object-cover"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">
                        {item.file.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(getEncodedText(item, outputFormat), i)}
                        aria-label={`Copiar base64 de ${item.file.name}`}
                        className={`cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        {copiedIndex === i ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadTextFile(
                            `${item.file.name.replace(/\.[^.]+$/, '')}.txt`,
                            getEncodedText(item, outputFormat),
                          )
                        }
                        aria-label={`Descargar base64 de ${item.file.name}`}
                        className={`cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        <IconDownload size={18} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={getEncodedText(item, outputFormat)}
                    readOnly
                    aria-label={`Base64 de ${item.file.name}`}
                    rows={5}
                    className={`mt-3 w-full rounded-lg border border-slate-500 bg-slate-50 p-3 text-sm break-all text-slate-800 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100 ${FOCUS_RING}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.items.map((item, i) => (
                <div
                  key={item.id}
                  className={`p-3 motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.4s_ease-out_forwards] ${GLASS_CARD}`}
                  style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  {item.error ? (
                    <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-slate-50 text-center dark:bg-slate-950">
                      <IconPhotoOff className="text-slate-500 dark:text-slate-400" size={28} />
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.error}</p>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: item.dataUrl,
                            name: `imagen-${i + 1}.${mimeToExtension(item.mime)}`,
                          })
                        }
                        className={`block aspect-square w-full cursor-pointer overflow-hidden rounded-lg border border-white/40 dark:border-slate-700/40 ${FOCUS_RING}`}
                      >
                        <img
                          src={item.dataUrl}
                          alt={`Imagen ${i + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </button>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(item.bytes)}
                        </p>
                        <div className="flex shrink-0 gap-1">
                          {CAN_COPY_IMAGE && (
                            <button
                              type="button"
                              onClick={() => copyImage(item, i)}
                              aria-label={`Copiar imagen ${i + 1}`}
                              className={`cursor-pointer rounded-lg p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 ${FOCUS_RING}`}
                            >
                              {copiedIndex === i ? (
                                <IconCheck size={16} />
                              ) : (
                                <IconCopy size={16} />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => downloadImage(item, i)}
                            aria-label={`Descargar imagen ${i + 1}`}
                            className={`cursor-pointer rounded-lg p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 ${FOCUS_RING}`}
                          >
                            <IconDownload size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </section>
    </>
  )
}

export default ImagenABase64

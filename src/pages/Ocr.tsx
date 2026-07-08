import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
import {
  IconBolt,
  IconCheck,
  IconCopy,
  IconDownload,
  IconLoader2,
  IconRefresh,
  IconUpload,
  IconWand,
  IconX,
} from '@tabler/icons-react'
import { createOcrWorker, recognizeWithMistral, recognizeWithTesseract } from '../lib/ocr'

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
}

type PreviewImage = {
  url: string
  name: string
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const Ocr = () => {
  const [engine, setEngine] = useState<Engine>('fast')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [results, setResults] = useState<FileResult[] | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!previewImage) return

    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewImage])

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming)
      .filter((file) => ACCEPTED_TYPES.includes(file.type))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    setFiles((prev) => [...prev, ...valid])
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
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
            const { text } = await recognizeWithTesseract(worker, file)
            newResults.push({ file, previewUrl, text })
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          }
          setResults(newResults)
        } finally {
          await worker.terminate()
        }
      } else {
        const newResults: FileResult[] = []
        for (const { file, previewUrl } of files) {
          let text = ''
          try {
            text = (await recognizeWithMistral(file)).text
          } catch (error) {
            text = error instanceof Error ? `[Error] ${error.message}` : '[Error desconocido]'
          }
          newResults.push({ file, previewUrl, text })
          setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
        }
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

  return (
    <section
      className={`mx-auto px-6 py-16 ${files.length > 0 ? 'max-w-4/5' : 'max-w-5xl'}`}
    >
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
        Imagen a texto
      </h1>
      <p className="mt-2 max-w-2xl text-base text-slate-500 dark:text-slate-400">
        Extrae el texto de tus imágenes con OCR rápido o con IA. Soporta varios archivos a la vez.
      </p>

      {!results && (
        <>
          <div
            className={`mt-8 grid grid-cols-1 gap-6 ${
              files.length > 0 ? 'lg:grid-cols-2' : ''
            }`}
          >
            <div className={`flex flex-col gap-4 ${files.length > 0 ? 'lg:h-[26rem]' : ''}`}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEngine('fast')}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    engine === 'fast'
                      ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10'
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
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                    engine === 'ai'
                      ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10'
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
                onDrop={handleDrop}
                onPaste={handlePaste}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition-colors hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400"
              >
                <IconUpload
                  className="text-slate-500 dark:text-slate-400"
                  size={32}
                  stroke={1.5}
                />
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Arrastra tus imágenes aquí o haz click para elegirlas
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  También puedes pegarlas con Ctrl+V. Formatos: JPG, PNG, WebP.
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
            </div>

            {files.length > 0 && (
              <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:h-[26rem]">
                <ul className="max-h-80 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                  {files.map(({ file, previewUrl }, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: previewUrl, name: file.name })}
                        className="shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-200 dark:border-slate-800"
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
                        className="shrink-0 cursor-pointer text-slate-500 hover:text-emerald-600 dark:text-slate-400"
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
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
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
          <button
            type="button"
            onClick={handleReset}
            className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
          >
            <IconRefresh size={18} />
            Volver a empezar
          </button>

          <div className="space-y-6">
            {results.map((result, i) => (
              <div
                key={`${result.file.name}-${i}`}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({ url: result.previewUrl, name: result.file.name })
                    }
                    className="shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <img
                      src={result.previewUrl}
                      alt={result.file.name}
                      className="h-14 w-14 object-cover"
                    />
                  </button>
                  <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    {result.file.name}
                  </h3>
                  <div className="ml-auto flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(result.text, i)}
                      className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400"
                    >
                      {copiedIndex === i ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadText(result.file.name, result.text)}
                      className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400"
                    >
                      <IconDownload size={18} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={result.text}
                  onChange={(e) => updateResultText(i, e.target.value)}
                  placeholder="El texto reconocido va a aparecer aquí..."
                  rows={6}
                  className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={previewImage.name}
            className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white"
          >
            <div className="flex items-center justify-between border-b border-emerald-200 px-4 py-3">
              <h3 className="truncate font-semibold text-slate-800">{previewImage.name}</h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="ml-3 shrink-0 cursor-pointer text-emerald-700 hover:text-emerald-900"
              >
                <IconX size={20} />
              </button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-h-[calc(85vh-53px)] w-full bg-white object-contain"
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default Ocr

import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import { IconDownload, IconResize, IconUpload, IconX } from '@tabler/icons-react'
import { resizeImage, SOCIAL_PRESETS, type ResizeMode } from '../lib/resize'
import OtherTools from '../components/OtherTools'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const Redimensionar = () => {
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const [presetKey, setPresetKey] = useState(SOCIAL_PRESETS[0].key)
  const [mode, setMode] = useState<ResizeMode>('cover')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const preset = SOCIAL_PRESETS.find((p) => p.key === presetKey) ?? SOCIAL_PRESETS[0]

  useEffect(() => {
    if (!image) return
    let cancelled = false
    resizeImage(image.file, preset.width, preset.height, mode, bgColor).then((url) => {
      if (!cancelled) setResultUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [image, preset, mode, bgColor])

  const addFile = (incoming: FileList | File[]) => {
    const file = Array.from(incoming).find((f) => ACCEPTED_TYPES.includes(f.type))
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return { file, previewUrl }
    })
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
  const removeImage = () => {
    if (image) URL.revokeObjectURL(image.previewUrl)
    setImage(null)
    setResultUrl(null)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Redimensionar para redes
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Presets listos para Instagram, LinkedIn, X, Facebook y YouTube.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 lg:h-104">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preset</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SOCIAL_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPresetKey(p.key)}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${FOCUS_RING} ${
                      presetKey === p.key
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span className="block font-semibold">{p.label}</span>
                    <span className="block text-slate-400 dark:text-slate-500">
                      {p.width}×{p.height}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ajuste</label>
                  <div className="mt-1 inline-flex w-full rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
                    {(['cover', 'contain'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex-1 cursor-pointer rounded-md px-2 py-2 text-xs font-medium transition-colors ${FOCUS_RING} ${
                          mode === m
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'
                        }`}
                      >
                        {m === 'cover' ? 'Recortar' : 'Ajustar'}
                      </button>
                    ))}
                  </div>
                </div>
                {mode === 'contain' && (
                  <div>
                    <label className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fondo</label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className={`mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 ${FOCUS_RING}`}
                    />
                  </div>
                )}
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
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${FOCUS_RING} ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                  : 'border-slate-300 bg-white hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400'
              }`}
            >
              {image ? (
                <div className="relative">
                  <img src={image.previewUrl} alt={image.file.name} className="max-h-32 rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage()
                    }}
                    className={`absolute -right-2 -top-2 cursor-pointer rounded-full bg-slate-800 p-1 text-white hover:bg-emerald-600 ${FOCUS_RING}`}
                  >
                    <IconX size={16} />
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
                    {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz click'}
                  </p>
                </>
              )}
              <input ref={inputRef} type="file" accept={ACCEPTED_EXT} onChange={handleChange} className="hidden" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-6 lg:h-104 dark:border-slate-800 dark:bg-slate-900">
            {resultUrl ? (
              <>
                <img
                  src={resultUrl}
                  alt="Resultado"
                  className="max-h-72 w-auto max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-800"
                />
                <a
                  href={resultUrl}
                  download={`${preset.key}.png`}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 ${FOCUS_RING}`}
                >
                  <IconDownload size={18} />
                  Descargar
                </a>
              </>
            ) : (
              <>
                <IconResize className="text-slate-300 dark:text-slate-700" size={64} stroke={1.5} />
                <p className="text-sm text-slate-500 dark:text-slate-400">Sube una imagen para ver el resultado</p>
              </>
            )}
          </div>
        </div>
      </section>
      <OtherTools currentHref="/redimensionar" />
    </>
  )
}

export default Redimensionar

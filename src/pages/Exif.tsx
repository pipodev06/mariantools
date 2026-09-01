import { useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react'
import { parse } from 'exifr'
import { IconDownload, IconInfoCircle, IconMapPin, IconUpload, IconX } from '@tabler/icons-react'
import OtherTools from '../components/OtherTools'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

type FieldRow = { label: string; value: string }

const FIELD_MAP: { key: string; label: string; format?: (v: unknown) => string }[] = [
  { key: 'Make', label: 'Marca de cámara' },
  { key: 'Model', label: 'Modelo de cámara' },
  { key: 'LensModel', label: 'Lente' },
  { key: 'DateTimeOriginal', label: 'Fecha de captura', format: (v) => (v instanceof Date ? v.toLocaleString('es-PE') : String(v)) },
  { key: 'ExposureTime', label: 'Exposición', format: (v) => `${v}s` },
  { key: 'FNumber', label: 'Apertura', format: (v) => `f/${v}` },
  { key: 'ISO', label: 'ISO' },
  { key: 'FocalLength', label: 'Distancia focal', format: (v) => `${v}mm` },
  { key: 'ExifImageWidth', label: 'Ancho (px)' },
  { key: 'ExifImageHeight', label: 'Alto (px)' },
  { key: 'Orientation', label: 'Orientación' },
  { key: 'Software', label: 'Software' },
]

const Exif = () => {
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const [rows, setRows] = useState<FieldRow[] | null>(null)
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null)
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const analyze = async (file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return { file, previewUrl }
    })
    setRows(null)
    setGps(null)
    setRaw(null)
    setError(false)
    setIsLoading(true)

    try {
      const data = (await parse(file, true)) as Record<string, unknown> | undefined
      if (!data) {
        setError(true)
        return
      }
      setRaw(data)
      const found: FieldRow[] = []
      for (const field of FIELD_MAP) {
        const value = data[field.key]
        if (value === undefined || value === null || value === '') continue
        found.push({ label: field.label, value: field.format ? field.format(value) : String(value) })
      }
      setRows(found)
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        setGps({ lat: data.latitude, lon: data.longitude })
      }
      if (found.length === 0) setError(true)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }

  const addFile = (incoming: FileList | File[]) => {
    const file = Array.from(incoming).find((f) => ACCEPTED_TYPES.includes(f.type))
    if (file) analyze(file)
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
    setRows(null)
    setGps(null)
    setRaw(null)
    setError(false)
  }

  const downloadJson = () => {
    if (!raw) return
    const text = JSON.stringify(raw, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'metadatos-exif.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Metadatos EXIF
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Mira ubicación, cámara y fecha de una foto, directo en tu navegador.
        </p>

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
                : 'border-slate-300 bg-white hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400'
            }`}
          >
            {image ? (
              <div className="relative">
                <img src={image.previewUrl} alt={image.file.name} className="max-h-56 rounded-lg object-contain" />
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
                  size={32}
                  stroke={1.5}
                />
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí o haz click para elegirla'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  También puedes pegarla con Ctrl+V. Formatos: JPG, PNG, WebP.
                </p>
              </>
            )}
            <input ref={inputRef} type="file" accept={ACCEPTED_EXT} onChange={handleChange} className="hidden" />
          </div>

          <div className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">Leyendo metadatos...</p>
              </div>
            ) : rows && rows.length > 0 ? (
              <div className="motion-safe:animate-[reveal-up_0.4s_ease-out_forwards]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Metadatos encontrados</h2>
                  <button
                    type="button"
                    onClick={downloadJson}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
                  >
                    <IconDownload size={14} />
                    JSON
                  </button>
                </div>
                <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                  {rows.map((row) => (
                    <li key={row.label} className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                      <span className="truncate text-slate-800 dark:text-slate-100">{row.value}</span>
                    </li>
                  ))}
                </ul>
                {gps && (
                  <a
                    href={`https://www.google.com/maps?q=${gps.lat},${gps.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 ${FOCUS_RING}`}
                  >
                    <IconMapPin size={16} />
                    Ver ubicación en el mapa
                  </a>
                )}
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <IconInfoCircle className="text-slate-300 dark:text-slate-700" size={40} stroke={1.5} />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Esa imagen no tiene metadatos EXIF (es común en capturas de pantalla o imágenes editadas/comprimidas).
                </p>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Los metadatos van a aparecer acá.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <OtherTools currentHref="/exif" />
    </>
  )
}

export default Exif

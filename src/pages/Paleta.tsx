import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
import { IconCheck, IconCopy, IconDownload, IconPalette, IconUpload, IconX } from '@tabler/icons-react'
import { extractPalette, type PaletteColor } from '../lib/palette'
import { FOCUS_RING, BUTTON_SECONDARY_BASE } from '../lib/ui'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_EXT = '.jpg,.jpeg,.png,.webp'

const Paleta = () => {
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const [colors, setColors] = useState<PaletteColor[] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(false)
  const [copiedHex, setCopiedHex] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  // Libera el object URL al cambiar de imagen, quitarla o desmontar la página.
  useEffect(() => {
    if (!image) return
    return () => URL.revokeObjectURL(image.previewUrl)
  }, [image])

  const analyze = async (file: File) => {
    setImage({ file, previewUrl: URL.createObjectURL(file) })
    setColors(null)
    setError(false)
    setIsAnalyzing(true)
    try {
      const palette = await extractPalette(file)
      if (palette.length === 0) {
        setError(true)
      } else {
        setColors(palette)
      }
    } catch {
      setError(true)
    } finally {
      setIsAnalyzing(false)
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
    setImage(null)
    setColors(null)
    setError(false)
  }

  const copyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex((current) => (current === hex ? null : current)), 1500)
  }

  const downloadPalette = () => {
    if (!colors) return
    const text = colors
      .map((c) => `${c.hex}  rgb(${c.rgb.join(', ')})  ${c.percentage}%`)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'paleta-de-colores.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Paleta de colores
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Extrae los colores dominantes de una imagen, directo en tu navegador.
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
                : 'border-slate-500 bg-white hover:border-emerald-600 dark:border-slate-500 dark:bg-slate-900 dark:hover:border-emerald-400'
            }`}
          >
            {image ? (
              <div className="relative">
                <img
                  src={image.previewUrl}
                  alt={image.file.name}
                  className="max-h-56 rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage()
                  }}
                  aria-label="Quitar imagen"
                  className={`absolute -right-2 -top-2 cursor-pointer rounded-full bg-slate-800 p-1 pointer-coarse:p-3 text-white hover:bg-emerald-700 ${FOCUS_RING}`}
                >
                  <IconX size={16} />
                </button>
              </div>
            ) : (
              <>
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
                    ? 'Suelta la imagen aquí'
                    : 'Arrastra una imagen aquí o haz click para elegirla'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  También puedes pegarla con Ctrl+V. Formatos: JPG, PNG, WebP.
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              aria-label="Elegir imagen"
              accept={ACCEPTED_EXT}
              onChange={handleChange}
              className="hidden"
            />
          </div>

          <div className="flex min-h-72 flex-col rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            {isAnalyzing ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <IconPalette
                  className="animate-pulse text-slate-400 dark:text-slate-600"
                  size={48}
                  aria-hidden="true"
                  stroke={1.5}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Analizando colores...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-1 items-center justify-center text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No se pudieron extraer colores de esa imagen.
                </p>
              </div>
            ) : colors ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Colores dominantes
                  </h2>
                  <button
                    type="button"
                    onClick={downloadPalette}
                    className={`${BUTTON_SECONDARY_BASE} px-3 py-1.5 text-xs`}
                  >
                    <IconDownload size={14} />
                    Descargar
                  </button>
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {colors.map((color) => (
                    <li key={color.hex}>
                      <button
                        type="button"
                        onClick={() => copyHex(color.hex)}
                        className={`group flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-950 ${FOCUS_RING}`}
                      >
                        <span
                          className="h-14 w-14 rounded-lg border border-slate-200 shadow-sm dark:border-slate-800"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="flex items-center gap-1 text-xs text-slate-800 dark:text-slate-100">
                          {copiedHex === color.hex ? (
                            <IconCheck size={12} />
                          ) : (
                            <IconCopy size={12} className="opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100" />
                          )}
                          {color.hex}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {color.percentage}%
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <IconPalette className="text-slate-400 dark:text-slate-600" aria-hidden="true" size={48} stroke={1.5} />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sube una imagen para ver sus colores dominantes
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Paleta

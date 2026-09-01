import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { IconArrowDown, IconArrowUp, IconDownload, IconFileTypePdf, IconLoader2, IconRefresh, IconUpload, IconX } from '@tabler/icons-react'
import { buildEntries, exportPages, loadPdfFile, type LoadedPdf, type PdfPageEntry } from '../lib/pdfEditor'
import OtherTools from '../components/OtherTools'

const ACCEPTED_TYPE = 'application/pdf'
const ACCEPTED_EXT = '.pdf'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const EditorPdf = () => {
  const [sources, setSources] = useState<LoadedPdf[]>([])
  const [entries, setEntries] = useState<PdfPageEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const addFiles = async (incoming: FileList | File[]) => {
    const files = Array.from(incoming).filter((f) => f.type === ACCEPTED_TYPE)
    if (files.length === 0) return
    setIsLoading(true)
    try {
      const loaded = await Promise.all(files.map(loadPdfFile))
      setSources((prev) => {
        const next = [...prev, ...loaded]
        setEntries((prevEntries) => [...prevEntries, ...buildEntries(loaded, prev.length)])
        return next
      })
    } finally {
      setIsLoading(false)
    }
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

  const moveEntry = (index: number, dir: -1 | 1) => {
    setEntries((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }
  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleReset = () => {
    setSources([])
    setEntries([])
  }

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCombined = async () => {
    setIsExporting(true)
    try {
      const blob = await exportPages(sources, entries)
      downloadBlob(blob, 'documento-editado.pdf')
    } finally {
      setIsExporting(false)
    }
  }

  const downloadSinglePage = async (entry: PdfPageEntry, position: number) => {
    const blob = await exportPages(sources, [entry])
    downloadBlob(blob, `pagina-${position}.pdf`)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Editor de PDF
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Une, divide o reordena páginas de tus PDF, directo en tu navegador.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            className={`flex min-h-72 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${FOCUS_RING} ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
                : 'border-slate-300 bg-white hover:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-400'
            }`}
          >
            {isLoading ? (
              <IconLoader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={32} />
            ) : (
              <>
                <IconUpload
                  className={isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}
                  size={32}
                  stroke={1.5}
                />
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {isDragging ? 'Suelta los PDF aquí' : 'Arrastra uno o varios PDF aquí o haz click'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Subir varios los une automáticamente, en el orden en que los agregues.
                </p>
              </>
            )}
            <input ref={inputRef} type="file" accept={ACCEPTED_EXT} multiple onChange={handleChange} className="hidden" />
          </div>

          {entries.length > 0 && (
            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:h-72">
              <ul className="max-h-80 flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-none">
                {entries.map((entry, i) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <IconFileTypePdf className="shrink-0 text-emerald-600 dark:text-emerald-400" size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-slate-800 dark:text-slate-100">
                        Página {i + 1}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {entry.sourceName} · pág. {entry.pageIndex + 1}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveEntry(i, -1)}
                        className={`cursor-pointer rounded text-slate-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        <IconArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={i === entries.length - 1}
                        onClick={() => moveEntry(i, 1)}
                        className={`cursor-pointer rounded text-slate-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        <IconArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        title="Descargar solo esta página"
                        onClick={() => downloadSinglePage(entry, i + 1)}
                        className={`cursor-pointer rounded text-slate-500 hover:text-emerald-600 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        <IconDownload size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className={`cursor-pointer rounded text-slate-500 hover:text-emerald-600 dark:text-slate-400 ${FOCUS_RING}`}
                      >
                        <IconX size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
            >
              <IconRefresh size={18} />
              Volver a empezar
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={downloadCombined}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 ${FOCUS_RING}`}
            >
              {isExporting ? <IconLoader2 size={18} className="animate-spin" /> : <IconDownload size={18} />}
              Descargar PDF ({entries.length} {entries.length === 1 ? 'página' : 'páginas'})
            </button>
          </div>
        )}
      </section>
      <OtherTools currentHref="/editor-pdf" />
    </>
  )
}

export default EditorPdf

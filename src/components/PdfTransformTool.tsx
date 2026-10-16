import { useState, type ReactNode } from 'react'
import { IconDownload, IconLoader2, IconRefresh } from '@tabler/icons-react'
import FileDropzone from './FileDropzone'
import ToolShell from './ToolShell'
import type { PdfResult } from '../lib/pdfTools'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const SECONDARY_BUTTON = `inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

type Props = {
  currentHref: string
  title: string
  subtitle: string
  actionLabel: string
  busyLabel: string
  /** Opciones de la operación (selectores, números). */
  controls?: ReactNode
  run: (file: File, onProgress: (done: number, total: number) => void) => Promise<PdfResult>
}

/** Un PDF entra, se le aplica una operación y se descarga el resultado (rotar, comprimir, PDF a JPG...). */
const PdfTransformTool = ({
  currentHref,
  title,
  subtitle,
  actionLabel,
  busyLabel,
  controls,
  run,
}: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<PdfResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
    setProgress(null)
  }

  const pickFile = (selected: File) => {
    reset()
    setFile(selected)
  }

  const handleRun = async () => {
    if (!file) return
    setIsRunning(true)
    setError('')
    setResult(null)
    setProgress(null)
    try {
      setResult(await run(file, (done, total) => setProgress({ done, total })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsRunning(false)
    }
  }

  const download = () => {
    if (!result) return
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolShell currentHref={currentHref} title={title} subtitle={subtitle}>
      {!file && (
        <div className="mt-8">
          <FileDropzone
            accept=".pdf,application/pdf"
            label="Arrastra tu PDF aquí o haz click para elegirlo"
            hint="Se procesa en tu navegador, el archivo no se sube a ningún servidor."
            onFile={pickFile}
          />
        </div>
      )}

      {file && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={reset} disabled={isRunning} className={SECONDARY_BUTTON}>
              <IconRefresh size={18} />
              Otro archivo
            </button>
            <p className="min-w-0 truncate text-sm text-slate-800 dark:text-slate-100">
              {file.name} · {formatSize(file.size)}
            </p>
          </div>

          {controls && (
            <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">{controls}</div>
          )}

          <button
            type="button"
            disabled={isRunning}
            onClick={handleRun}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 ${FOCUS_RING}`}
          >
            {isRunning && <IconLoader2 size={18} className="animate-spin" />}
            <span role="status">
              {isRunning
                ? `${busyLabel}${progress ? ` (${progress.done}/${progress.total})` : ''}...`
                : actionLabel}
            </span>
          </button>

          {error && (
            <p
              role="alert"
              className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300"
            >
              {error}
            </p>
          )}

          {result && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-800 dark:text-slate-100">
                {result.filename} · {formatSize(result.blob.size)}
                {result.blob.type === 'application/pdf' && result.blob.size !== file.size && (
                  <span className="text-slate-500 dark:text-slate-400">
                    {' '}
                    (original {formatSize(file.size)})
                  </span>
                )}
              </p>
              <button type="button" onClick={download} className={SECONDARY_BUTTON}>
                <IconDownload size={18} />
                Descargar
              </button>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  )
}

export default PdfTransformTool

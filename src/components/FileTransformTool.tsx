import { useEffect, useState, type ReactNode } from 'react'
import ErrorNotice from './ErrorNotice'
import { IconDownload, IconLoader2, IconRefresh } from '@tabler/icons-react'
import FileDropzone from './FileDropzone'
import ToolShell from './ToolShell'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../lib/ui'

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

export type FileResult = { blob: Blob; filename: string }

type Props = {
  title: string
  subtitle: string
  actionLabel: string
  busyLabel: string
  /** Valor del atributo `accept` del input (extensiones o MIME types). */
  accept: string
  dropLabel: string
  dropHint: string
  /** Opciones de la operación (selectores, números). */
  controls?: ReactNode
  run: (file: File, onProgress: (done: number, total: number) => void) => Promise<FileResult>
}

/** Un archivo entra, se le aplica una operación y se descarga el resultado (rotar, comprimir, convertir...). */
const FileTransformTool = ({
  title,
  subtitle,
  actionLabel,
  busyLabel,
  accept,
  dropLabel,
  dropHint,
  controls,
  run,
}: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<(FileResult & { previewUrl: string | null }) | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Libera la vista previa al reemplazar o quitar el resultado, y al desmontar.
  useEffect(() => {
    const url = result?.previewUrl
    if (!url) return
    return () => URL.revokeObjectURL(url)
  }, [result])

  const clearResult = () => setResult(null)

  const reset = () => {
    clearResult()
    setFile(null)
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
    clearResult()
    setProgress(null)
    try {
      const output = await run(file, (done, total) => setProgress({ done, total }))
      const isImage = output.blob.type.startsWith('image/')
      const previewUrl = isImage ? URL.createObjectURL(output.blob) : null
      setResult({ ...output, previewUrl })
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
    <ToolShell title={title} subtitle={subtitle}>
      {!file && (
        <div className="mt-8">
          <FileDropzone accept={accept} label={dropLabel} hint={dropHint} onFile={pickFile} />
        </div>
      )}

      {file && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={reset} disabled={isRunning} className={BUTTON_SECONDARY}>
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
            className={BUTTON_PRIMARY}
          >
            {isRunning && <IconLoader2 size={18} className="animate-spin" />}
            <span role="status">
              {isRunning
                ? `${busyLabel}${progress ? ` (${progress.done}/${progress.total})` : ''}...`
                : actionLabel}
            </span>
          </button>

          {error && (
            <ErrorNotice message={error} />
          )}

          {result && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              {result.previewUrl && (
                <img
                  src={result.previewUrl}
                  alt={result.filename}
                  className="max-h-48 max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-800"
                />
              )}
              <p className="text-sm text-slate-800 dark:text-slate-100">
                {result.filename} · {formatSize(result.blob.size)}
                {result.blob.type === file.type && result.blob.size !== file.size && (
                  <span className="text-slate-500 dark:text-slate-400">
                    {' '}
                    (original {formatSize(file.size)})
                  </span>
                )}
              </p>
              <button type="button" onClick={download} className={BUTTON_SECONDARY}>
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

export default FileTransformTool

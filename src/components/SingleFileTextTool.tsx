import { useState } from 'react'
import { writeClipboardText } from '../lib/clipboard'
import { IconCheck, IconCopy, IconDownload, IconLoader2, IconRefresh } from '@tabler/icons-react'
import { AiError } from '../lib/aiClient'
import AiErrorNotice from './AiErrorNotice'
import FileDropzone from './FileDropzone'
import { BUTTON_SECONDARY } from '../lib/ui'

export type SingleFileOutput = { text: string; note?: string }

type Props = {
  title: string
  subtitle: string
  accept: string
  dropLabel: string
  dropHint: string
  busyLabel: string
  run: (file: File, onProgress: (done: number, total: number) => void) => Promise<SingleFileOutput>
}

/** Un archivo entra, un texto sale (PDF a texto, audio a texto). */
const SingleFileTextTool = ({
  title,
  subtitle,
  accept,
  dropLabel,
  dropHint,
  busyLabel,
  run,
}: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [output, setOutput] = useState<SingleFileOutput | null>(null)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState<string>()
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleFile = async (selected: File) => {
    setFile(selected)
    setOutput(null)
    setError('')
    setProgress(null)
    setIsRunning(true)
    try {
      setOutput(await run(selected, (done, total) => setProgress({ done, total })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setErrorCode(err instanceof AiError ? err.code : undefined)
    } finally {
      setIsRunning(false)
    }
  }

  const reset = () => {
    setFile(null)
    setOutput(null)
    setError('')
    setProgress(null)
  }

  const copyText = async () => {
    if (!output) return
    if (!(await writeClipboardText(output.text))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    if (!output || !file) return
    const url = URL.createObjectURL(new Blob([output.text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${file.name.replace(/\.[^.]+$/, '')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>

        {!file && (
          <div className="mt-8">
            <FileDropzone accept={accept} label={dropLabel} hint={dropHint} onFile={handleFile} />
          </div>
        )}

        {file && (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={reset} disabled={isRunning} className={BUTTON_SECONDARY}>
                <IconRefresh size={18} />
                Otro archivo
              </button>
              <p className="min-w-0 truncate text-sm text-slate-800 dark:text-slate-100">
                {file.name}
              </p>
            </div>

            {isRunning && (
              <p
                role="status"
                className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
              >
                <IconLoader2 size={18} className="animate-spin" />
                {busyLabel}
                {progress ? ` (${progress.done}/${progress.total})` : ''}...
              </p>
            )}

            {error && <AiErrorNotice message={error} code={errorCode} />}

            {output && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{output.note}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={copyText} className={BUTTON_SECONDARY}>
                      {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      Copiar
                    </button>
                    <button type="button" onClick={download} className={BUTTON_SECONDARY}>
                      <IconDownload size={18} />
                      Descargar .txt
                    </button>
                  </div>
                </div>
                <p className="max-h-[32rem] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm break-words whitespace-pre-wrap text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                  {output.text || 'No se encontró texto.'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  )
}

export default SingleFileTextTool

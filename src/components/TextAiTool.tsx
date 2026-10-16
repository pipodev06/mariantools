import { useState, type ReactNode } from 'react'
import { IconCheck, IconCopy, IconLoader2, IconTrash } from '@tabler/icons-react'
import { MAX_AI_TEXT_LENGTH } from '../lib/ai'
import { AiError } from '../lib/aiClient'
import AiErrorNotice from './AiErrorNotice'
import { FOCUS_RING, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../lib/ui'

const FIELD =
  'mt-2 h-80 w-full resize-none rounded-lg border border-slate-500 bg-white p-3 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100'

type Props = {
  title: string
  subtitle: string
  inputPlaceholder: string
  outputLabel: string
  actionLabel: string
  busyLabel: string
  run: (text: string) => Promise<string>
  /** Controles extra (ej. largo del resumen) junto al botón de acción. */
  controls?: ReactNode
}

const TextAiTool = ({
  title,
  subtitle,
  inputPlaceholder,
  outputLabel,
  actionLabel,
  busyLabel,
  run,
  controls,
}: Props) => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState<string>()
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRun = async () => {
    setIsRunning(true)
    setError('')
    try {
      setOutput(await run(input))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setErrorCode(err instanceof AiError ? err.code : undefined)
    } finally {
      setIsRunning(false)
    }
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label
              htmlFor="ai-text-input"
              className="text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              Texto
            </label>
            <textarea
              id="ai-text-input"
              value={input}
              maxLength={MAX_AI_TEXT_LENGTH}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              className={`${FIELD} ${FOCUS_RING}`}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {input.length}/{MAX_AI_TEXT_LENGTH} · Se envía a IA para procesarse
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="ai-text-output"
                className="text-sm font-semibold text-slate-800 dark:text-slate-100"
              >
                {outputLabel}
              </label>
              {output && (
                <button
                  type="button"
                  onClick={copyOutput}
                  className={`inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  Copiar
                </button>
              )}
            </div>
            <textarea
              id="ai-text-output"
              value={output}
              readOnly
              className={`${FIELD} ${FOCUS_RING}`}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {controls}
          <button
            type="button"
            disabled={!input.trim() || isRunning}
            onClick={handleRun}
            className={BUTTON_PRIMARY}
          >
            {isRunning && <IconLoader2 size={18} className="animate-spin" />}
            <span role="status">{isRunning ? busyLabel : actionLabel}</span>
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!input && !output}
            className={BUTTON_SECONDARY}
          >
            <IconTrash size={18} />
            Limpiar
          </button>
        </div>

        {error && <AiErrorNotice message={error} code={errorCode} className="mt-4" />}
      </section>
    </>
  )
}

export default TextAiTool

import { useId, useMemo, useState } from 'react'
import { writeClipboardText } from '../lib/clipboard'
import { diffLines, diffWords } from 'diff'
import { IconArrowsLeftRight, IconCheck, IconCopy, IconTrash } from '@tabler/icons-react'
import { FOCUS_RING, BUTTON_SECONDARY, CHIP_ACTIVE, CHIP_INACTIVE, BADGE } from '../lib/ui'

type DiffMode = 'word' | 'line'

const FIELD =
  'mt-2 h-64 w-full resize-none rounded-lg border border-slate-500 bg-white p-3 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100'

const Comparador = () => {
  const uid = useId()
  const [original, setOriginal] = useState('')
  const [nuevo, setNuevo] = useState('')
  const [mode, setMode] = useState<DiffMode>('word')
  const [copied, setCopied] = useState(false)

  const diffResult = useMemo(
    () => (mode === 'word' ? diffWords(original, nuevo) : diffLines(original, nuevo)),
    [original, nuevo, mode],
  )

  const hasInput = original.length > 0 || nuevo.length > 0

  const stats = diffResult.reduce(
    (acc, part) => {
      if (part.added) acc.added += part.count ?? 1
      if (part.removed) acc.removed += part.count ?? 1
      return acc
    },
    { added: 0, removed: 0 },
  )

  const swap = () => {
    setOriginal(nuevo)
    setNuevo(original)
  }

  const clear = () => {
    setOriginal('')
    setNuevo('')
  }

  const copyResult = async () => {
    if (!(await writeClipboardText(nuevo))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Comparador de textos
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Mira las diferencias entre dos textos o versiones, directo en tu navegador.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800">
            {(['word', 'line'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`cursor-pointer rounded-md px-4 py-1.5 text-sm transition-colors ${FOCUS_RING} ${
                  mode === m
                    ? CHIP_ACTIVE
                    : CHIP_INACTIVE
                }`}
              >
                {m === 'word' ? 'Por palabra' : 'Por línea'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={swap}
              disabled={!hasInput}
              title="Intercambiar textos"
              className={BUTTON_SECONDARY}
            >
              <IconArrowsLeftRight size={18} />
              Intercambiar
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={!hasInput}
              className={BUTTON_SECONDARY}
            >
              <IconTrash size={18} />
              Limpiar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-original`} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Texto original
            </label>
            <textarea
              id={`${uid}-original`}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Pega o escribe el texto original"
              className={`${FIELD} ${FOCUS_RING}`}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-nuevo`} className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Texto nuevo
            </label>
            <textarea
              id={`${uid}-nuevo`}
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="Pega o escribe el texto nuevo"
              className={`${FIELD} ${FOCUS_RING}`}
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Diferencias
            </h2>
            {hasInput && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-800 dark:text-emerald-400">+{stats.added}</span>
                  {' / '}
                  <span className="text-red-700 dark:text-red-400">-{stats.removed}</span>
                  {mode === 'word' ? ' palabras' : ' líneas'}
                </span>
                <button
                  type="button"
                  onClick={copyResult}
                  className={`inline-flex cursor-pointer items-center gap-1 pointer-coarse:min-h-11 text-xs font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  Copiar texto nuevo
                </button>
              </div>
            )}
          </div>

          {hasInput ? (
            <p className="max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm break-words whitespace-pre-wrap text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
              {diffResult.map((part, i) => (
                <span
                  key={i}
                  className={
                    part.added
                      ? BADGE.emerald
                      : part.removed
                        ? `${BADGE.red} line-through`
                        : ''
                  }
                >
                  {part.value}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Escribe o pega dos textos arriba para ver las diferencias.
            </p>
          )}
        </div>
      </section>
    </>
  )
}

export default Comparador

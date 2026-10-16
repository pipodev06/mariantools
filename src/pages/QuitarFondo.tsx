import { useEffect, useState } from 'react'
import { IconDownload, IconLoader2, IconRefresh } from '@tabler/icons-react'
import FileDropzone from '../components/FileDropzone'
import OtherTools from '../components/OtherTools'
import { removeBackground } from '../lib/removeBackground'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const SECONDARY_BUTTON = `inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`

const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%), linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 10px 10px',
}

type State = {
  file: File
  originalUrl: string
  resultUrl?: string
  error?: string
}

const QuitarFondo = () => {
  const [state, setState] = useState<State | null>(null)
  const [modelPercent, setModelPercent] = useState<number | null>(null)

  // Libera los object URLs al cambiar de imagen o desmontar la página.
  useEffect(() => {
    if (!state) return
    return () => {
      URL.revokeObjectURL(state.originalUrl)
      if (state.resultUrl) URL.revokeObjectURL(state.resultUrl)
    }
  }, [state])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setState({ file, originalUrl: '', error: 'El archivo no es una imagen' })
      return
    }

    const originalUrl = URL.createObjectURL(file)
    setState({ file, originalUrl })
    setModelPercent(null)
    try {
      const blob = await removeBackground(file, setModelPercent)
      setState({ file, originalUrl, resultUrl: URL.createObjectURL(blob) })
    } catch (err) {
      setState({
        file,
        originalUrl,
        error: err instanceof Error ? err.message : 'No se pudo quitar el fondo',
      })
    }
  }

  const download = () => {
    if (!state?.resultUrl) return
    const a = document.createElement('a')
    a.href = state.resultUrl
    a.download = `${state.file.name.replace(/\.[^.]+$/, '')}-sin-fondo.png`
    a.click()
  }

  const isRunning = !!state && !state.resultUrl && !state.error

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Quitar fondo de imagen
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Deja el fondo transparente al instante. Funciona mejor con personas.
        </p>

        {!state && (
          <div className="mt-8">
            <FileDropzone
              accept="image/jpeg,image/png,image/webp"
              label="Arrastra tu imagen aquí o haz click para elegirla"
              hint="JPG, PNG o WebP. Se procesa en tu navegador."
              onFile={handleFile}
            />
          </div>
        )}

        {state && (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setState(null)}
                disabled={isRunning}
                className={`${SECONDARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <IconRefresh size={18} />
                Otra imagen
              </button>
              {state.resultUrl && (
                <button type="button" onClick={download} className={SECONDARY_BUTTON}>
                  <IconDownload size={18} />
                  Descargar PNG
                </button>
              )}
            </div>

            {state.error && (
              <p
                role="alert"
                className="mb-4 inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300"
              >
                {state.error}
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {state.originalUrl && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <img
                    src={state.originalUrl}
                    alt="Original"
                    className="mx-auto max-h-[32rem] object-contain"
                  />
                </div>
              )}
              <div
                className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                style={CHECKERBOARD}
              >
                {state.resultUrl && (
                  <img
                    src={state.resultUrl}
                    alt="Sin fondo"
                    className="mx-auto max-h-[32rem] object-contain"
                  />
                )}
                {isRunning && (
                  <p
                    role="status"
                    className="inline-flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm text-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
                  >
                    <IconLoader2 size={18} className="animate-spin" />
                    {modelPercent !== null && modelPercent < 100
                      ? `Descargando modelo (${modelPercent}%)...`
                      : 'Quitando el fondo...'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
      <OtherTools currentHref="/quitar-fondo" />
    </>
  )
}

export default QuitarFondo

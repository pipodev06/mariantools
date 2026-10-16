import { useMemo, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import ToolCard from '../components/ToolCard'
import { availableTools, categories, upcomingTools, type Category } from '../data/tools'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

// Búsqueda sin tildes ni mayúsculas: "extraccion" encuentra "Extracción".
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const Inicio = () => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | null>(null)

  const visibleTools = useMemo(() => {
    const needle = normalize(query.trim())
    return availableTools.filter(
      (tool) =>
        (!category || tool.category === category) &&
        (!needle || normalize(`${tool.title} ${tool.description} ${tool.category}`).includes(needle)),
    )
  }, [query, category])

  return (
    <>
      <section className="relative mx-auto max-w-5xl overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-emerald-200/40 via-transparent to-slate-200/40 dark:from-emerald-500/10 dark:via-transparent dark:to-slate-800/20" />
        <div className="grid items-center gap-10 rounded-2xl border border-white/40 bg-white/60 px-8 py-16 text-center shadow-sm backdrop-blur-md dark:border-slate-700/40 dark:bg-slate-800/40 lg:grid-cols-[1.2fr_1fr] lg:text-left">
          <div className="motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.6s_ease-out_forwards]">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 sm:text-5xl">
              Herramientas web para todos tus archivos
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-800 dark:text-slate-100 lg:mx-0">
              OCR, conversión de archivos, edición de imágenes y más — gratis, directo
              desde el navegador.
            </p>
          </div>

          <div
            className="flex justify-center motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.6s_ease-out_forwards] lg:justify-end"
            style={{ animationDelay: '120ms' }}
            aria-hidden="true"
          >
            <div className="relative h-32 w-56 overflow-hidden rounded-xl border border-white/40 bg-white/70 shadow-sm sm:w-64 dark:border-slate-700/40 dark:bg-slate-900/60">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/80 shadow-[0_0_10px_1px_rgba(16,185,129,0.55)] motion-safe:animate-[scan-sweep_2.6s_ease-in-out_infinite]" />
              <div className="flex h-full flex-col justify-center gap-2 p-4">
                <div className="h-2 w-4/5 rounded-full bg-slate-300/70 dark:bg-slate-700/70" />
                <div className="h-2 w-full rounded-full bg-slate-300/70 dark:bg-slate-700/70" />
                <div className="h-2 w-3/5 rounded-full bg-emerald-400/80 dark:bg-emerald-500/60" />
                <div className="h-2 w-full rounded-full bg-slate-300/70 dark:bg-slate-700/70" />
                <div className="h-2 w-2/3 rounded-full bg-slate-300/70 dark:bg-slate-700/70" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-2xl font-bold text-emerald-600 sm:text-3xl dark:text-emerald-400">
          Herramientas disponibles
        </h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-72">
            <IconSearch
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar herramienta"
              aria-label="Buscar herramienta"
              className={`w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${FOCUS_RING}`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[null, ...categories].map((c) => (
              <button
                key={c ?? 'todas'}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
                  category === c
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-emerald-400 dark:hover:text-emerald-400'
                }`}
              >
                {c ?? 'Todas'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleTools.map((tool, i) => (
            <div
              key={tool.title}
              className="motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
            >
              <ToolCard {...tool} />
            </div>
          ))}
        </div>
        {visibleTools.length === 0 && (
          <p role="status" className="mt-4 text-center text-base text-slate-500 dark:text-slate-400">
            No hay herramientas que coincidan con tu búsqueda.
          </p>
        )}
      </section>

      {upcomingTools.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl dark:text-slate-100">
            Próximamente
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {upcomingTools.map((tool, i) => (
              <div
                key={tool.title}
                className="motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.5s_ease-out_forwards]"
                style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
              >
                <ToolCard {...tool} comingSoon />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default Inicio

import { Link } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import { availableTools, upcomingTools } from '../data/tools'

const Inicio = () => {
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
            <Link
              to="/tools"
              className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            >
              Ver herramientas
            </Link>
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
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {availableTools.map((tool, i) => (
            <div
              key={tool.title}
              className="motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
            >
              <ToolCard {...tool} />
            </div>
          ))}
        </div>
      </section>

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
    </>
  )
}

export default Inicio

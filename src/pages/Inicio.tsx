import { Link } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import { availableTools, upcomingTools } from '../data/tools'

const Inicio = () => {
  return (
    <>
      <section className="relative mx-auto max-w-5xl overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-emerald-200/40 via-transparent to-slate-200/40 dark:from-emerald-500/10 dark:via-transparent dark:to-slate-800/20" />
        <div className="rounded-2xl border border-white/40 bg-white/60 px-8 py-16 text-center shadow-sm backdrop-blur-md dark:border-slate-700/40 dark:bg-slate-800/40">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 sm:text-5xl">
            Herramientas web para todos tus archivos
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-800 dark:text-slate-100">
            OCR, conversión de archivos, edición de imágenes y más — gratis, directo
            desde el navegador.
          </p>
          <Link
            to="/tools"
            className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Ver herramientas
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-2xl font-bold text-emerald-600 sm:text-3xl dark:text-emerald-400">
          Herramientas disponibles
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {availableTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl dark:text-slate-100">
          Próximamente
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {upcomingTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} comingSoon />
          ))}
        </div>
      </section>
    </>
  )
}

export default Inicio

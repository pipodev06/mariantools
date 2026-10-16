import { Link } from 'react-router-dom'

const NoEncontrada = () => (
  <section className="mx-auto max-w-7xl px-6 py-16">
    <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
      Página no encontrada
    </h1>
    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
      La dirección que buscas no existe.{' '}
      <Link
        to="/"
        className="font-semibold text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400"
      >
        Volver al inicio
      </Link>
    </p>
  </section>
)

export default NoEncontrada

import { Link } from 'react-router-dom'
import { faq } from '../data/faq'
import { FOCUS_RING } from '../lib/ui'

const PreguntasFrecuentes = () => (
  <section className="mx-auto max-w-3xl px-6 py-16">
    <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
      Preguntas frecuentes
    </h1>

    <div className="mt-8 space-y-6">
      {faq.map(({ q, a }) => (
        <div key={q} className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{q}</h2>
          <p className="text-base text-slate-500 dark:text-slate-400">{a}</p>
        </div>
      ))}
    </div>

    <p className="mt-10 text-base text-slate-800 dark:text-slate-100">
      ¿No encontraste tu respuesta?{' '}
      <Link
        to="/comentarios"
        className={`font-semibold text-emerald-800 dark:text-emerald-400 ${FOCUS_RING}`}
      >
        Escríbenos
      </Link>
      .
    </p>
  </section>
)

export default PreguntasFrecuentes

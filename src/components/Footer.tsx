import { Link } from 'react-router-dom'
import { FOCUS_RING } from '../lib/ui'

const LINKS = [
  { to: '/cuenta', label: 'Mi cuenta' },
  { to: '/preguntas-frecuentes', label: 'Preguntas frecuentes' },
  { to: '/comentarios', label: 'Comentarios' },
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/terminos', label: 'Términos' },
  { to: '/contacto', label: 'Contacto' },
]

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} MarianTools
        </p>
        <nav aria-label="Enlaces del sitio" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`inline-flex items-center pointer-coarse:min-h-11 rounded text-sm text-slate-500 transition-colors hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default Footer

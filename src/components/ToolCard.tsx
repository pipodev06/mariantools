import { Link } from 'react-router-dom'
import { BADGE } from '../lib/ui'
import type { Tool } from '../data/tools'

type ToolCardProps = Tool & { comingSoon?: boolean }

const ToolCard = ({ title, description, href, icon: Icon, ai, comingSoon }: ToolCardProps) => {
  const content = (
    <div
      className={`relative flex h-full min-h-44 sm:h-auto flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-center sm:aspect-square sm:p-5 transition-colors dark:border-slate-800 dark:bg-slate-900 ${
        comingSoon ? '' : 'hover:border-emerald-600 dark:hover:border-emerald-400'
      }`}
    >
      {comingSoon && (
        <span className="absolute -right-9 top-4 w-32 rotate-45 bg-slate-800 py-0.5 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm dark:bg-slate-700">
          Pronto
        </span>
      )}
      {ai && (
        <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE.emerald}`}>
          IA
        </span>
      )}
      <Icon className="text-emerald-600 dark:text-emerald-400" size={44} stroke={1.5} />
      {/* La marca de ancho cero deja partir "Comprimir/convertir" en móvil. */}
      <h3 className="text-base font-semibold text-slate-800 sm:text-lg dark:text-slate-100">{title.replace('/', '/​')}</h3>
      <p className="line-clamp-3 text-sm sm:line-clamp-2 text-slate-500 sm:text-base dark:text-slate-400">{description}</p>
    </div>
  )

  if (href && !comingSoon) {
    return (
      <Link to={href} className="block h-full sm:h-auto">
        {content}
      </Link>
    )
  }

  return content
}

export default ToolCard

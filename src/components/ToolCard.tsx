import { Link } from 'react-router-dom'
import type { Tool } from '../data/tools'

type ToolCardProps = Tool & { comingSoon?: boolean }

const ToolCard = ({ title, description, href, icon: Icon, comingSoon }: ToolCardProps) => {
  const content = (
    <div
      className={`relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-center transition-colors dark:border-slate-800 dark:bg-slate-900 ${
        comingSoon ? '' : 'hover:border-emerald-600 dark:hover:border-emerald-400'
      }`}
    >
      {comingSoon && (
        <span className="absolute -right-9 top-4 w-32 rotate-45 bg-slate-800 py-0.5 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm dark:bg-slate-700">
          Pronto
        </span>
      )}
      <Icon className="text-emerald-600 dark:text-emerald-400" size={44} stroke={1.5} />
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="line-clamp-2 text-base text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  )

  if (href && !comingSoon) {
    return <Link to={href}>{content}</Link>
  }

  return content
}

export default ToolCard

// Clases Tailwind compartidas (ver AGENTS.md, sección Estilo/diseño). Una sola definición por patrón.

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

// Botón primario sin padding ni tamaño de texto, para variantes compactas (`${BUTTON_PRIMARY_BASE} px-4 py-2 text-xs`).
export const BUTTON_PRIMARY_BASE = `inline-flex cursor-pointer items-center gap-2 pointer-coarse:min-h-11 rounded-lg font-semibold transition-colors bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 ${FOCUS_RING}`

export const BUTTON_PRIMARY = `${BUTTON_PRIMARY_BASE} px-6 py-3 text-sm`

export const BUTTON_SECONDARY_BASE = `inline-flex cursor-pointer items-center gap-2 pointer-coarse:min-h-11 rounded-lg border border-slate-200 font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`

export const BUTTON_SECONDARY = `${BUTTON_SECONDARY_BASE} px-4 py-2 text-sm`

export const INPUT = `mt-1 w-full pointer-coarse:min-h-11 rounded-lg border border-slate-500 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 ${FOCUS_RING}`

// Tarjeta sin padding (para variantes con p-6, etc.) y con el padding por defecto.
export const CARD_BASE = 'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

export const CARD = `${CARD_BASE} p-5`

// Chips de filtro / selección única: activo sólido, activo suave (tarjetas de opción) e inactivo.
export const CHIP_ACTIVE =
  'border-emerald-700 bg-emerald-700 text-white hover:border-emerald-800 hover:bg-emerald-800 dark:border-emerald-500 dark:bg-emerald-500 dark:text-slate-950 dark:hover:border-emerald-400 dark:hover:bg-emerald-400'

export const CHIP_SELECTED =
  'border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-400'

export const CHIP_INACTIVE =
  'border-slate-200 text-slate-500 hover:border-emerald-600 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-emerald-400 dark:hover:text-emerald-400'

export type BadgeTone = 'emerald' | 'amber' | 'red' | 'slate'

export const BADGE: Record<BadgeTone, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  slate: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
}

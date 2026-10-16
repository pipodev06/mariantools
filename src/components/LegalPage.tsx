import type { ReactNode } from 'react'
import { LEGAL_UPDATED } from '../data/site'

type Props = { title: string; children: ReactNode }

/** Contenedor común de las páginas legales (privacidad, términos, contacto). */
const LegalPage = ({ title, children }: Props) => (
  <section className="mx-auto max-w-3xl px-6 py-16">
    <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">{title}</h1>
    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Actualizado: {LEGAL_UPDATED}</p>
    <div className="mt-8 space-y-8">{children}</div>
  </section>
)

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="space-y-2">
    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
    <div className="space-y-2 text-base text-slate-800 dark:text-slate-100">{children}</div>
  </div>
)

export default LegalPage

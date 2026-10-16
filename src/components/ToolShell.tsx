import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
}

/** Estructura común de una tool page: título, subtítulo y contenido. */
const ToolShell = ({ title, subtitle, children }: Props) => (
  <section className="mx-auto max-w-7xl px-6 py-16">
    <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">{title}</h1>
    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">{subtitle}</p>
    {children}
  </section>
)

export default ToolShell

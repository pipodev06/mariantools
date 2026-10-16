import type { ToolInfoEntry } from '../data/toolInfo'

type Props = { title: string; info: ToolInfoEntry }

/** Bloque "Cómo usar" bajo una herramienta: pasos, consejos y preguntas frecuentes. */
const ToolInfo = ({ title, info }: Props) => (
  <section className="mx-auto max-w-7xl px-6 pb-16">
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cómo usar: {title}</h2>

      <ol className="list-decimal space-y-1 pl-6 text-base text-slate-800 dark:text-slate-100">
        {info.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      {info.tips && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Consejos</h3>
          <ul className="list-disc space-y-1 pl-6 text-base text-slate-800 dark:text-slate-100">
            {info.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {info.faq && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Preguntas frecuentes</h3>
          {info.faq.map(({ q, a }) => (
            <div key={q}>
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">{q}</h4>
              <p className="text-base text-slate-500 dark:text-slate-400">{a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)

export default ToolInfo

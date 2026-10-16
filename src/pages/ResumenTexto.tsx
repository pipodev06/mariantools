import { useState } from 'react'
import TextAiTool from '../components/TextAiTool'
import { SUMMARY_LENGTH_OPTIONS, summarizeText } from '../lib/ai'

const ResumenTexto = () => {
  const [length, setLength] = useState('medium')

  return (
    <TextAiTool
      currentHref="/resumen"
      title="Resumen de texto"
      subtitle="Resume documentos largos en segundos con IA."
      inputPlaceholder="Pega o escribe el texto a resumir"
      outputLabel="Resumen"
      actionLabel="Resumir"
      busyLabel="Resumiendo..."
      run={(text) => summarizeText(text, length)}
      controls={
        <select
          value={length}
          onChange={(e) => setLength(e.target.value)}
          aria-label="Largo del resumen"
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
        >
          {SUMMARY_LENGTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      }
    />
  )
}

export default ResumenTexto

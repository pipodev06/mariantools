import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { TextAreaField } from '../components/FormFields'
import { textStats } from '../lib/textStats'
import { CARD } from '../lib/ui'

const ContadorPalabras = () => {
  const [texto, setTexto] = useState('')
  const s = textStats(texto)

  const items = [
    { label: 'Palabras', value: s.palabras },
    { label: 'Caracteres', value: s.caracteres },
    { label: 'Sin espacios', value: s.caracteresSinEspacios },
    { label: 'Oraciones', value: s.oraciones },
    { label: 'Párrafos', value: s.parrafos },
    { label: 'Lectura', value: `${s.minutosLectura} min` },
    { label: 'En voz alta', value: `${s.minutosVoz} min` },
  ]

  return (
    <ToolShell title="Contador de palabras" subtitle="Cuenta palabras, caracteres, oraciones y párrafos al instante.">
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <TextAreaField label="Tu texto" value={texto} onChange={setTexto} rows={14} />
        <dl className="grid grid-cols-2 content-start gap-3" aria-live="polite">
          {items.map((item) => (
            <div key={item.label} className={CARD}>
              <dt className="text-sm text-slate-500 dark:text-slate-400">{item.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ToolShell>
  )
}

export default ContadorPalabras

import { useState } from 'react'
import ImageAiTool from '../components/ImageAiTool'
import { TARGET_LANGUAGES, translateImage } from '../lib/ai'

const TraductorImagen = () => {
  const [lang, setLang] = useState('es')

  return (
    <ImageAiTool<string>
      currentHref="/traductor-imagen"
      title="Traductor de imagen"
      subtitle="Lee el texto de una imagen y lo traduce con IA."
      actionLabel="Traducir"
      busyLabel="Traduciendo"
      run={(file) => translateImage(file, lang)}
      toText={(value) => value}
      downloadExt="txt"
      controls={
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label="Idioma de destino"
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
        >
          {TARGET_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      }
    />
  )
}

export default TraductorImagen

import { useState } from 'react'
import ImageAiTool from '../components/ImageAiTool'
import { TARGET_LANGUAGES, translateImage } from '../lib/ai'
import Select from '../components/Select'
import { FOCUS_RING } from '../lib/ui'

const TraductorImagen = () => {
  const [lang, setLang] = useState('es')

  return (
    <ImageAiTool<string>
      title="Traductor de imagen"
      subtitle="Lee el texto de una imagen y lo traduce con IA."
      actionLabel="Traducir"
      busyLabel="Traduciendo"
      run={(file) => translateImage(file, lang)}
      toText={(value) => value}
      downloadExt="txt"
      controls={
        <Select
          value={lang}
          onChange={setLang}
          ariaLabel="Idioma de destino"
          options={TARGET_LANGUAGES}
          className={`rounded-lg border border-slate-500 bg-white px-3 py-3 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 ${FOCUS_RING}`}
        />
      }
    />
  )
}

export default TraductorImagen

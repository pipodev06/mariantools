import { useId, useState } from 'react'
import { IconDownload, IconFileTypePdf, IconFileWord, IconLoader2, IconMarkdown } from '@tabler/icons-react'
import { markdownToDocx, markdownToPdf } from '../lib/markdownExport'
import { FOCUS_RING, BUTTON_PRIMARY, BUTTON_SECONDARY_BASE } from '../lib/ui'

const PLACEHOLDER = `# Título del documento

Escribe o pega tu **Markdown** acá. Soporta *cursiva*, listas, \`código\` y más.

- Primer punto
- Segundo punto

> Una cita destacada.`

const MarkdownConverter = () => {
  const textareaId = useId()
  const [markdown, setMarkdown] = useState('')
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingDocx, setIsExportingDocx] = useState(false)

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    setIsExportingPdf(true)
    try {
      const blob = markdownToPdf(markdown)
      downloadBlob(blob, 'documento.pdf')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const exportDocx = async () => {
    setIsExportingDocx(true)
    try {
      const blob = await markdownToDocx(markdown)
      downloadBlob(blob, 'documento.docx')
    } finally {
      setIsExportingDocx(false)
    }
  }

  const hasContent = markdown.trim().length > 0

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
          Markdown a PDF/Word
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Convierte Markdown a un documento con formato, directo en tu navegador.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <label htmlFor={textareaId} className="text-sm font-semibold text-slate-800 dark:text-slate-100">Markdown</label>
            <IconMarkdown className="text-slate-500 dark:text-slate-400" size={20} />
          </div>
          <textarea
            id={textareaId}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={16}
            className={`mt-2 w-full rounded-lg border border-slate-500 bg-white p-4 text-sm text-slate-800 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100 ${FOCUS_RING}`}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!hasContent || isExportingPdf}
              onClick={exportPdf}
              className={BUTTON_PRIMARY}
            >
              {isExportingPdf ? <IconLoader2 size={18} className="animate-spin" /> : <IconFileTypePdf size={18} />}
              Descargar PDF
            </button>
            <button
              type="button"
              disabled={!hasContent || isExportingDocx}
              onClick={exportDocx}
              className={`${BUTTON_SECONDARY_BASE} px-6 py-3 text-sm`}
            >
              {isExportingDocx ? <IconLoader2 size={18} className="animate-spin" /> : <IconFileWord size={18} />}
              Descargar Word
            </button>
            {!hasContent && (
              <span className="inline-flex items-center gap-1 self-center text-xs text-slate-500 dark:text-slate-400">
                <IconDownload size={14} />
                Escribe algo de Markdown primero
              </span>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default MarkdownConverter

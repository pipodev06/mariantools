import { useRef, useState, type DragEvent } from 'react'
import { IconUpload } from '@tabler/icons-react'
import { FOCUS_RING } from '../lib/ui'

type Props = {
  /** Valor del atributo `accept` del input (extensiones o MIME types). */
  accept: string
  label: string
  hint: string
  onFile: (file: File) => void
}

const FileDropzone = ({ accept, label, hint, onFile }: Props) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      role="button"
      tabIndex={0}
      className={`flex min-h-72 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${FOCUS_RING} ${
        isDragging
          ? 'border-emerald-600 bg-emerald-50/60 dark:border-emerald-400 dark:bg-emerald-500/10'
          : 'border-slate-500 bg-white hover:border-emerald-600 dark:border-slate-500 dark:bg-slate-900 dark:hover:border-emerald-400'
      }`}
    >
      <IconUpload
        className={
          isDragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
        }
        size={32}
        stroke={1.5}
      />
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        {isDragging ? 'Suelta el archivo aquí' : label}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
        className="hidden"
      />
    </div>
  )
}

export default FileDropzone

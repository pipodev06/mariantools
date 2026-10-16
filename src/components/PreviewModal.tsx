import { useEffect, useRef } from 'react'
import { IconX } from '@tabler/icons-react'
import { FOCUS_RING } from '../lib/ui'

export type PreviewImage = {
  url: string
  name: string
}

type PreviewModalProps = {
  image: PreviewImage | null
  onClose: () => void
}

const PreviewModal = ({ image, onClose }: PreviewModalProps) => {
  const closeRef = useRef<HTMLButtonElement>(null)
  // Ref al callback: así el efecto no se vuelve a suscribir cuando el padre pasa una función nueva.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!image) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [image])

  if (!image) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-6 motion-safe:animate-[fade-in_0.15s_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={image.name}
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white motion-safe:animate-[modal-pop_0.18s_ease-out] dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="truncate font-semibold text-slate-800 dark:text-slate-100">{image.name}</h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className={`ml-3 shrink-0 cursor-pointer rounded p-1 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 ${FOCUS_RING}`}
          >
            <IconX size={20} />
          </button>
        </div>
        <img
          src={image.url}
          alt={image.name}
          className="max-h-[calc(85vh-53px)] w-full object-contain"
        />
      </div>
    </div>
  )
}

export default PreviewModal

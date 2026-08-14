import { useEffect } from 'react'
import { IconX } from '@tabler/icons-react'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

export type PreviewImage = {
  url: string
  name: string
}

type PreviewModalProps = {
  image: PreviewImage | null
  onClose: () => void
}

const PreviewModal = ({ image, onClose }: PreviewModalProps) => {
  useEffect(() => {
    if (!image) return

    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [image, onClose])

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
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white motion-safe:animate-[modal-pop_0.18s_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-emerald-200 px-4 py-3">
          <h3 className="truncate font-semibold text-slate-800">{image.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className={`ml-3 shrink-0 cursor-pointer rounded text-emerald-700 hover:text-emerald-900 ${FOCUS_RING}`}
          >
            <IconX size={20} />
          </button>
        </div>
        <img
          src={image.url}
          alt={image.name}
          className="max-h-[calc(85vh-53px)] w-full bg-white object-contain"
        />
      </div>
    </div>
  )
}

export default PreviewModal

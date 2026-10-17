import { useEffect, useId, useRef, type ReactNode } from 'react'
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../lib/ui'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Diálogo de confirmación: Escape o clic fuera cancelan; el foco va al botón de confirmar y vuelve al cerrar. */
const ConfirmModal = ({ open, title, children, confirmLabel, cancelLabel = 'Cancelar', onConfirm, onCancel }: Props) => {
  const titleId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)
  // Ref al callback: el efecto no se vuelve a suscribir cuando el padre pasa una función nueva.
  const onCancelRef = useRef(onCancel)
  useEffect(() => {
    onCancelRef.current = onCancel
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelRef.current()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-6 motion-safe:animate-[fade-in_0.15s_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl bg-white p-6 motion-safe:animate-[modal-pop_0.18s_ease-out] dark:bg-slate-900"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <div className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} className={BUTTON_SECONDARY}>
            {cancelLabel}
          </button>
          <button ref={confirmRef} type="button" onClick={onConfirm} className={BUTTON_PRIMARY}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

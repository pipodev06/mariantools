import { useRef, useState, type FormEvent } from 'react'
import ErrorNotice from '../components/ErrorNotice'
import { IconLoader2 } from '@tabler/icons-react'
import { EmailField, SelectField, TextAreaField } from '../components/FormFields'
import { authHeaders } from '../lib/supabase'
import { BUTTON_PRIMARY, BADGE } from '../lib/ui'

const KINDS = [
  { value: 'sugerencia', label: 'Sugerencia o herramienta nueva' },
  { value: 'comentario', label: 'Comentario' },
  { value: 'error', label: 'Algo no funciona' },
]

const MIN_MESSAGE = 10

const Comentarios = () => {
  const [kind, setKind] = useState('sugerencia')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  // Campo trampa para bots: queda fuera de la vista y de la navegación con teclado.
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const sendingRef = useRef(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (sendingRef.current) return
    sendingRef.current = true
    setStatus('sending')
    setError('')
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          kind,
          message,
          email: email.trim() || undefined,
          website,
          page: document.referrer ? new URL(document.referrer).pathname : undefined,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? 'No se pudo enviar tu mensaje. Inténtalo de nuevo.')
      }
      setStatus('sent')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar tu mensaje.')
      setStatus('error')
    } finally {
      sendingRef.current = false
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">
        Comentarios y sugerencias
      </h1>
      <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
        Cuéntanos qué herramienta te falta, qué mejorarías o qué no funciona.
      </p>

      {status === 'sent' ? (
        <p
          role="status"
          className={`mt-8 inline-block rounded-full px-4 py-2 text-sm ${BADGE.emerald}`}
        >
          ¡Gracias! Recibimos tu mensaje.
        </p>
      ) : (
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <SelectField label="Tipo de mensaje" value={kind} onChange={setKind} options={KINDS} />
          <TextAreaField label="Tu mensaje" value={message} onChange={setMessage} maxLength={2000} />
          <EmailField label="Tu correo (opcional, solo si quieres respuesta)" value={email} onChange={setEmail} />

          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              No llenes este campo
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={status === 'sending' || message.trim().length < MIN_MESSAGE}
            className={BUTTON_PRIMARY}
          >
            {status === 'sending' && <IconLoader2 size={18} className="animate-spin" />}
            Enviar
          </button>

          {status === 'error' && (
            <ErrorNotice message={error} />
          )}
        </form>
      )}
    </section>
  )
}

export default Comentarios

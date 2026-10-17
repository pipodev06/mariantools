import { useEffect, useState, type FormEvent } from 'react'
import { IconBrandGoogle, IconLoader2 } from '@tabler/icons-react'
import { getSupabase } from '../lib/supabase'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT } from '../lib/ui'
import ErrorNotice from './ErrorNotice'
import { EmailField } from './FormFields'

const CODE_LENGTH = 6
// Supabase solo deja pedir un código nuevo por correo cada 60 s.
const RESEND_SECONDS = 60

/** Inicio de sesión: Google o un código de 6 dígitos (también sirve el enlace) enviado al correo. */
const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const signInWithGoogle = async () => {
    setError('')
    const supabase = await getSupabase()
    if (!supabase) return setError('El inicio de sesión no está disponible.')
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/cuenta` },
    })
    if (authError) setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.')
  }

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    setError('')
    try {
      const supabase = await getSupabase()
      if (!supabase) return setError('El inicio de sesión no está disponible.')
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/cuenta` },
      })
      if (authError) {
        return setError(
          authError.status === 429
            ? 'Espera un minuto antes de pedir otro código.'
            : 'No se pudo enviar el código. Revisa tu correo e inténtalo de nuevo.',
        )
      }
      setCode('')
      setCooldown(RESEND_SECONDS)
      setStep('code')
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const supabase = await getSupabase()
      if (!supabase) return setError('El inicio de sesión no está disponible.')
      const { error: authError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      })
      // Si el código es correcto, el estado de la cuenta cambia solo y esta pantalla desaparece.
      if (authError) setError('El código no es válido o venció. Pide uno nuevo.')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'code') {
    return (
      <form onSubmit={verifyCode} className={`${CARD} mx-auto max-w-md space-y-4 text-left`}>
        <p className="text-base text-slate-800 dark:text-slate-100">
          Enviamos un código de {CODE_LENGTH} dígitos a <strong>{email}</strong>. También puedes abrir el
          enlace del correo.
        </p>
        <div>
          <label htmlFor="login-code" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Código
          </label>
          <input
            id="login-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={INPUT}
          />
        </div>
        <button type="submit" disabled={busy || code.length !== CODE_LENGTH} className={BUTTON_PRIMARY}>
          {busy && <IconLoader2 size={18} className="animate-spin" />}
          Entrar
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || cooldown > 0}
            onClick={() => void sendCode()}
            className={BUTTON_SECONDARY}
          >
            {cooldown > 0 ? `Reenviar código (${cooldown} s)` : 'Reenviar código'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setStep('email')
              setError('')
            }}
            className={BUTTON_SECONDARY}
          >
            Usar otro correo
          </button>
        </div>
        {error && <ErrorNotice message={error} />}
      </form>
    )
  }

  return (
    <div className={`${CARD} mx-auto max-w-md space-y-4 text-left`}>
      <button type="button" onClick={signInWithGoogle} className={`${BUTTON_SECONDARY} w-full justify-center`}>
        <IconBrandGoogle size={18} aria-hidden="true" />
        Continuar con Google
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">o con tu correo</p>

      <form onSubmit={sendCode} className="space-y-4">
        <EmailField label="Correo electrónico" value={email} onChange={setEmail} />
        <button type="submit" disabled={busy || !email} className={BUTTON_PRIMARY}>
          {busy && <IconLoader2 size={18} className="animate-spin" />}
          Enviarme un código
        </button>
      </form>

      {error && <ErrorNotice message={error} />}
    </div>
  )
}

export default LoginForm

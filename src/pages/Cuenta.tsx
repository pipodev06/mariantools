import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { IconLoader2 } from '@tabler/icons-react'
import { NumberField } from '../components/FormFields'
import { CREDIT_PACKS } from '../lib/credits'
import { getSupabase } from '../lib/supabase'

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'

const BUTTON = `inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:border-emerald-600 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${FOCUS_RING}`

const PRIMARY_BUTTON = `inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700 ${FOCUS_RING}`

const CARD = 'rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'

type Movement = { id: number; delta: number; reason: string; tool: string | null; created_at: string }

const REASONS: Record<string, string> = {
  spend: 'Uso',
  refund: 'Devolución',
  grant: 'Recarga',
  signup: 'Bienvenida',
}

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const supabase = await getSupabase()
    if (!supabase) return setStatus('error')

    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/cuenta` },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <form onSubmit={submit} className={`${CARD} max-w-md space-y-4`}>
      <label htmlFor="cuenta-email" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        Correo electrónico
      </label>
      <input
        id="cuenta-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${FOCUS_RING}`}
      />
      <button type="submit" disabled={status === 'sending' || !email} className={PRIMARY_BUTTON}>
        {status === 'sending' && <IconLoader2 size={18} className="animate-spin" />}
        Enviarme un enlace de acceso
      </button>
      <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
        {status === 'sent' && 'Revisa tu correo y abre el enlace para entrar.'}
        {status === 'error' && 'No se pudo enviar el enlace. Inténtalo de nuevo.'}
      </p>
    </form>
  )
}

const Account = ({ session }: { session: Session }) => {
  const [balance, setBalance] = useState<number | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [reload, setReload] = useState(0)
  const [devAmount, setDevAmount] = useState('50')

  useEffect(() => {
    let cancelled = false
    getSupabase().then(async (supabase) => {
      if (!supabase || cancelled) return
      const [account, ledger] = await Promise.all([
        supabase.from('credit_accounts').select('balance').maybeSingle(),
        supabase
          .from('credit_ledger')
          .select('id, delta, reason, tool, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      if (cancelled) return
      setBalance(account.data?.balance ?? 0)
      setMovements((ledger.data as Movement[] | null) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [session.user.id, reload])

  const signOut = async () => {
    const supabase = await getSupabase()
    await supabase?.auth.signOut()
  }

  const devGrant = async () => {
    await fetch('/api/dev-grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ amount: Number(devAmount) }),
    })
    setReload((n) => n + 1)
  }

  return (
    <div className="space-y-8">
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{session.user.email}</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {balance === null ? '...' : balance} créditos
          </p>
        </div>
        <button type="button" onClick={signOut} className={BUTTON}>
          Cerrar sesión
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Comprar créditos</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.id} className={`${CARD} space-y-3`}>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {pack.credits} créditos
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                US$ {pack.priceUsd}
              </p>
              <button type="button" disabled className={BUTTON}>
                Próximamente
              </button>
            </div>
          ))}
        </div>
      </div>

      {import.meta.env.DEV && (
        <div className={`${CARD} flex flex-wrap items-end gap-4`}>
          <NumberField label="Créditos de prueba (solo desarrollo)" value={devAmount} onChange={setDevAmount} step={1} />
          <button type="button" onClick={devGrant} className={BUTTON}>
            Acreditar
          </button>
        </div>
      )}

      {movements.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Movimientos</h2>
          <ul className={`${CARD} mt-4 divide-y divide-slate-200 dark:divide-slate-800`}>
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-slate-800 dark:text-slate-100">
                  {REASONS[m.reason] ?? m.reason}
                  {m.tool ? ` · ${m.tool}` : ''}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {new Date(m.created_at).toLocaleDateString('es-PE')}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const Cuenta = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [configured, setConfigured] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    getSupabase().then((supabase) => {
      if (cancelled) return
      if (!supabase) {
        setConfigured(false)
        setSession(null)
        return
      }
      const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">Mi cuenta</h1>
      <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
        Tus créditos para las herramientas con IA. Las demás herramientas son gratis.
      </p>

      <div className="mt-8">
        {session === undefined && <IconLoader2 size={24} className="animate-spin text-slate-500" />}
        {session === null && configured && <LoginForm />}
        {session === null && !configured && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Las cuentas no están disponibles todavía.
          </p>
        )}
        {session && <Account session={session} />}
      </div>
    </section>
  )
}

export default Cuenta

import { useEffect, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { NumberField } from '../components/FormFields'
import LoginForm from '../components/LoginForm'
import { refreshAccount, useAccount } from '../lib/account'
import { CREDIT_PACKS } from '../lib/credits'
import { authHeaders, getSupabase } from '../lib/supabase'
import { BUTTON_SECONDARY, CARD } from '../lib/ui'

type Movement = { id: number; delta: number; reason: string; tool: string | null; created_at: string }

const REASONS: Record<string, string> = {
  spend: 'Uso',
  refund: 'Devolución',
  grant: 'Recarga',
  signup: 'Bienvenida',
}

const Account = () => {
  const { email, balance } = useAccount()
  const [movements, setMovements] = useState<Movement[]>([])
  const [devAmount, setDevAmount] = useState('50')

  // El saldo cambia con cada uso de IA o recarga: al cambiar, se vuelve a leer el historial.
  useEffect(() => {
    let cancelled = false
    getSupabase().then(async (supabase) => {
      if (!supabase || cancelled) return
      const ledger = await supabase
        .from('credit_ledger')
        .select('id, delta, reason, tool, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      if (!cancelled) setMovements((ledger.data as Movement[] | null) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [balance])

  const signOut = async () => {
    const supabase = await getSupabase()
    await supabase?.auth.signOut()
  }

  const devGrant = async () => {
    await fetch('/api/dev-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ amount: Number(devAmount) }),
    })
    refreshAccount()
  }

  return (
    <div className="space-y-8">
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{email}</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {balance === null ? '...' : balance} créditos
          </p>
        </div>
        <button type="button" onClick={signOut} className={BUTTON_SECONDARY}>
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
              <button type="button" disabled className={BUTTON_SECONDARY}>
                Próximamente
              </button>
            </div>
          ))}
        </div>
      </div>

      {import.meta.env.DEV && (
        <div className={`${CARD} flex flex-wrap items-end gap-4`}>
          <NumberField label="Créditos de prueba (solo desarrollo)" value={devAmount} onChange={setDevAmount} step={1} />
          <button type="button" onClick={devGrant} className={BUTTON_SECONDARY}>
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
  const { status } = useAccount()

  return (
    <section className={`mx-auto max-w-7xl px-6 py-16 ${status === 'user' ? '' : 'text-center'}`}>
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl dark:text-slate-100">Mi cuenta</h1>
      <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
        Tus créditos para las herramientas con IA. Las demás herramientas son gratis.
      </p>

      <div className="mt-8">
        {status === 'loading' && <IconLoader2 size={24} className="animate-spin text-slate-500 dark:text-slate-400" />}
        {status === 'anon' && <LoginForm />}
        {status === 'off' && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Las cuentas no están disponibles todavía.
          </p>
        )}
        {status === 'user' && <Account />}
      </div>
    </section>
  )
}

export default Cuenta

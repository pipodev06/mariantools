import { Link } from 'react-router-dom'
import { IconCoin } from '@tabler/icons-react'
import { useAccount } from '../lib/account'
import { FOCUS_RING, BUTTON_SECONDARY_BASE } from '../lib/ui'

/** Acceso a la cuenta en el header: "Iniciar sesión" sin sesión, o el saldo de créditos con ella. */
const AccountLink = () => {
  const { status, balance } = useAccount()

  if (status === 'loading' || status === 'off') return null

  if (status === 'anon') {
    return (
      <Link
        to="/cuenta"
        className={`inline-flex items-center pointer-coarse:min-h-11 rounded-lg text-sm font-semibold text-slate-800 transition-colors hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400 ${FOCUS_RING}`}
      >
        Iniciar sesión
      </Link>
    )
  }

  return (
    <Link
      to="/cuenta"
      aria-label={`Mi cuenta, ${balance ?? 0} créditos`}
      className={`${BUTTON_SECONDARY_BASE} px-3 py-1.5 text-sm`}
    >
      <IconCoin size={18} className="text-emerald-600 dark:text-emerald-400" />
      {balance === null ? '...' : balance}
    </Link>
  )
}

export default AccountLink

import { Link } from 'react-router-dom'
import { NEEDS_ACCOUNT_CODES } from '../lib/aiClient'

type Props = {
  message: string
  /** Código de AiError: si pide cuenta o créditos, se ofrece el enlace a "Mi cuenta". */
  code?: string
  className?: string
}

/** Chip de error de las herramientas con IA, con enlace a /cuenta cuando falta sesión o saldo. */
const AiErrorNotice = ({ message, code, className = '' }: Props) => (
  <p
    role="alert"
    className={`inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300 ${className}`}
  >
    {message}
    {code && NEEDS_ACCOUNT_CODES.includes(code) && (
      <>
        {' '}
        <Link
          to="/cuenta"
          className="font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Ir a mi cuenta
        </Link>
      </>
    )}
  </p>
)

export default AiErrorNotice

import { Link } from 'react-router-dom'
import { NEEDS_ACCOUNT_CODES } from '../lib/aiClient'
import { FOCUS_RING } from '../lib/ui'
import ErrorNotice from './ErrorNotice'

type Props = {
  message: string
  /** Código de AiError: si pide cuenta o créditos, se ofrece el enlace a "Mi cuenta". */
  code?: string
  className?: string
}

/** Chip de error de las herramientas con IA, con enlace a /cuenta cuando falta sesión o saldo. */
const AiErrorNotice = ({ message, code, className }: Props) => (
  <ErrorNotice
    className={className}
    message={
      <>
        {message}
        {code && NEEDS_ACCOUNT_CODES.includes(code) && (
          <>
            {' '}
            <Link to="/cuenta" className={`rounded font-semibold underline ${FOCUS_RING}`}>
              Ir a mi cuenta
            </Link>
          </>
        )}
      </>
    }
  />
)

export default AiErrorNotice

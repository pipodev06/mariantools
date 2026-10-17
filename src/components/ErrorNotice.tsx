import type { ReactNode } from 'react'
import { BADGE } from '../lib/ui'

type Props = {
  message: ReactNode
  className?: string
}

/** Chip de error genérico (role="alert"). */
const ErrorNotice = ({ message, className = '' }: Props) => (
  <p role="alert" className={`inline-block rounded-full px-3 py-1 text-sm ${BADGE.red} ${className}`.trim()}>
    {message}
  </p>
)

export default ErrorNotice

import { useEffect } from 'react'
import { BADGE } from '../lib/ui'
import { useLocation } from 'react-router-dom'
import { availableTools } from '../data/tools'
import { refreshQuota, useAccount } from '../lib/account'
import { addRecent } from '../lib/recent'

/**
 * Franja sobre cada herramienta: dice si se procesa en el navegador (gratis) o con IA en el servidor,
 * cuánto cuesta y cuántos usos gratis quedan hoy. También registra la herramienta como reciente.
 */
const ToolNote = () => {
  const { pathname } = useLocation()
  const { status, freeLeft, freeLimit } = useAccount()
  const path = pathname.replace(/\/+$/, '') || '/'
  const tool = availableTools.find((t) => t.href === path)
  const usesAi = Boolean(tool?.ai)

  useEffect(() => {
    if (tool?.href) addRecent(tool.href)
  }, [tool?.href])

  useEffect(() => {
    if (usesAi && status !== 'loading' && status !== 'off') void refreshQuota()
  }, [usesAi, status])

  if (!tool) return null

  const free = freeLeft !== null && freeLimit !== null ? `${freeLeft} de ${freeLimit} usos gratis hoy` : null
  const text = tool.ai
    ? [
        tool.ai.optional ? 'Gratis en tu navegador, o con IA' : 'Con IA',
        `${tool.ai.cost} por uso`,
        free,
        'tu archivo se envía a un proveedor de IA',
      ]
    : ['Gratis']

  return (
    <div className="mx-auto max-w-7xl px-6 pt-6">
      <p
        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
          tool.ai
            ? BADGE.emerald
            : BADGE.slate
        }`}
      >
        {text.filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}

export default ToolNote

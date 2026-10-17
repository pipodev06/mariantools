import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { availableTools } from '../data/tools'
import { addRecent } from '../lib/recent'

/** Sin interfaz: registra la herramienta abierta en "Recientes" del inicio (`lib/recent.ts`). */
const RecentTracker = () => {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'
  const href = availableTools.find((t) => t.href === path)?.href

  useEffect(() => {
    if (href) addRecent(href)
  }, [href])

  return null
}

export default RecentTracker

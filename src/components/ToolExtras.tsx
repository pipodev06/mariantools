import { useLocation } from 'react-router-dom'
import { availableTools } from '../data/tools'
import { toolInfo } from '../data/toolInfo'
import OtherTools from './OtherTools'
import ToolInfo from './ToolInfo'

/** Debajo de toda herramienta: su bloque "Cómo usar" (si lo tiene) y "Otras herramientas". */
const ToolExtras = () => {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'
  const tool = availableTools.find((t) => t.href === path)
  if (!tool) return null

  const info = toolInfo[path]
  return (
    <>
      {info && <ToolInfo title={tool.title} info={info} />}
      <OtherTools currentHref={path} />
    </>
  )
}

export default ToolExtras

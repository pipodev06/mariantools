import ToolCard from './ToolCard'
import { availableTools } from '../data/tools'

type OtherToolsProps = {
  currentHref: string
}

const OtherTools = ({ currentHref }: OtherToolsProps) => {
  const tools = availableTools.filter((tool) => tool.href !== currentHref)
  if (tools.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <h2 className="text-2xl font-bold text-emerald-600 sm:text-3xl dark:text-emerald-400">
        Otras herramientas
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tools.map((tool, i) => (
          <div
            key={tool.title}
            className="motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.5s_ease-out_forwards]"
            style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
          >
            <ToolCard {...tool} />
          </div>
        ))}
      </div>
    </section>
  )
}

export default OtherTools

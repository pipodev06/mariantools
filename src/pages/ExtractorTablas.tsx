import ImageAiTool from '../components/ImageAiTool'
import { extractTable, tableToCsv } from '../lib/ai'

const ExtractorTablas = () => (
  <ImageAiTool<string[][]>
    currentHref="/extractor-tablas"
    title="Extractor de tablas"
    subtitle="Convierte tablas de una imagen a CSV listo para Excel."
    actionLabel="Extraer tabla"
    busyLabel="Extrayendo"
    run={extractTable}
    toText={tableToCsv}
    downloadExt="csv"
    renderResult={(rows) => (
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {rows[0].map((cell, i) => (
              <th
                key={i}
                className="border border-slate-200 px-3 py-2 font-semibold dark:border-slate-800"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-slate-200 px-3 py-2 dark:border-slate-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  />
)

export default ExtractorTablas

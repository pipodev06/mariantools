import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { NumberField, ResultCard, SelectField } from '../components/FormFields'
import { formatSoles, igv, parseMoney } from '../lib/laboral'

const MODOS = [
  { value: 'agregar', label: 'Agregar IGV (tengo el valor sin IGV)' },
  { value: 'quitar', label: 'Quitar IGV (tengo el total con IGV)' },
]

const CalculadoraIgv = () => {
  const [monto, setMonto] = useState('')
  const [tasa, setTasa] = useState('18')
  const [modo, setModo] = useState('agregar')

  const result = igv(parseMoney(monto), parseMoney(tasa), modo as 'agregar' | 'quitar')

  return (
    <ToolShell
      title="Calculadora de IGV"
      subtitle="Agrega o quita el IGV de un monto al instante."
    >
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SelectField label="Operación" value={modo} onChange={setModo} options={MODOS} />
          </div>
          <NumberField label="Monto (S/)" value={monto} onChange={setMonto} />
          <NumberField label="Tasa de IGV (%)" value={tasa} onChange={setTasa} />
        </div>
        <ResultCard
          rows={[
            { label: 'Valor sin IGV', value: formatSoles(result.base) },
            { label: 'IGV', value: formatSoles(result.impuesto) },
            { label: 'Total con IGV', value: formatSoles(result.total), strong: true },
          ]}
        />
      </div>
    </ToolShell>
  )
}

export default CalculadoraIgv

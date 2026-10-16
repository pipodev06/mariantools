import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { NumberField, ResultCard } from '../components/FormFields'
import { cts, formatSoles, parseMoney, remuneracionComputable } from '../lib/laboral'

const NOTE = 'Cálculo referencial del régimen laboral general. No reemplaza una liquidación oficial.'

const CalculadoraCts = () => {
  const [sueldo, setSueldo] = useState('')
  const [asignacion, setAsignacion] = useState('')
  const [variables, setVariables] = useState('')
  const [meses, setMeses] = useState('6')
  const [dias, setDias] = useState('0')

  const rem = remuneracionComputable({
    sueldo: parseMoney(sueldo),
    asignacionFamiliar: parseMoney(asignacion),
    variables: parseMoney(variables),
  })
  const tiempo = {
    months: Math.min(6, Math.trunc(parseMoney(meses))),
    days: Math.min(29, Math.trunc(parseMoney(dias))),
  }
  // La última gratificación equivale a una remuneración computable.
  const total = cts(rem, rem, tiempo)

  return (
    <ToolShell
      title="Calculadora de CTS"
      subtitle="Calcula tu Compensación por Tiempo de Servicios del semestre."
    >
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Sueldo mensual (S/)" value={sueldo} onChange={setSueldo} />
          <NumberField label="Asignación familiar (S/)" value={asignacion} onChange={setAsignacion} />
          <NumberField
            label="Promedio de variables (S/)"
            value={variables}
            onChange={setVariables}
          />
          <NumberField label="Meses completos (0 a 6)" value={meses} onChange={setMeses} step={1} />
          <NumberField label="Días adicionales" value={dias} onChange={setDias} step={1} />
        </div>
        <ResultCard
          rows={[
            { label: 'Remuneración computable', value: formatSoles(rem) },
            { label: '1/6 de la gratificación', value: formatSoles(rem / 6) },
            { label: 'CTS a depositar', value: formatSoles(total), strong: true },
          ]}
          note={NOTE}
        />
      </div>
    </ToolShell>
  )
}

export default CalculadoraCts

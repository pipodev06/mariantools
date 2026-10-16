import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { NumberField, ResultCard, SelectField } from '../components/FormFields'
import {
  BONIF_EPS,
  BONIF_ESSALUD,
  formatSoles,
  gratificacion,
  parseMoney,
  remuneracionComputable,
} from '../lib/laboral'

const SEGUROS = [
  { value: 'essalud', label: 'EsSalud (9%)' },
  { value: 'eps', label: 'EPS (6.75%)' },
]

const CalculadoraGratificacion = () => {
  const [sueldo, setSueldo] = useState('')
  const [asignacion, setAsignacion] = useState('')
  const [variables, setVariables] = useState('')
  const [meses, setMeses] = useState('6')
  const [seguro, setSeguro] = useState('essalud')

  const rem = remuneracionComputable({
    sueldo: parseMoney(sueldo),
    asignacionFamiliar: parseMoney(asignacion),
    variables: parseMoney(variables),
  })
  const grat = gratificacion(
    rem,
    Math.trunc(parseMoney(meses)),
    seguro === 'eps' ? BONIF_EPS : BONIF_ESSALUD,
  )

  return (
    <ToolShell
      title="Calculadora de gratificación"
      subtitle="Calcula tu gratificación de julio o diciembre con su bonificación extraordinaria."
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
          <SelectField label="Seguro de salud" value={seguro} onChange={setSeguro} options={SEGUROS} />
        </div>
        <ResultCard
          rows={[
            { label: 'Remuneración computable', value: formatSoles(rem) },
            { label: 'Gratificación', value: formatSoles(grat.base) },
            { label: 'Bonificación extraordinaria', value: formatSoles(grat.bonificacion) },
            { label: 'Total a recibir', value: formatSoles(grat.total), strong: true },
          ]}
          note="Cálculo referencial del régimen laboral general. No reemplaza una liquidación oficial."
        />
      </div>
    </ToolShell>
  )
}

export default CalculadoraGratificacion

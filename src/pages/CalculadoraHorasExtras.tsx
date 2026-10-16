import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { NumberField, ResultCard } from '../components/FormFields'
import { formatSoles, horasExtras, parseMoney } from '../lib/laboral'

const CalculadoraHorasExtras = () => {
  const [sueldo, setSueldo] = useState('')
  const [jornada, setJornada] = useState('8')
  const [horas25, setHoras25] = useState('')
  const [horas35, setHoras35] = useState('')

  const result = horasExtras(
    parseMoney(sueldo),
    parseMoney(jornada),
    parseMoney(horas25),
    parseMoney(horas35),
  )

  return (
    <ToolShell
      title="Calculadora de horas extras"
      subtitle="Calcula el pago de tus horas extras: 25% las dos primeras del día y 35% desde la tercera."
    >
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Sueldo mensual (S/)" value={sueldo} onChange={setSueldo} />
          <NumberField label="Horas de jornada diaria" value={jornada} onChange={setJornada} />
          <NumberField label="Horas extras al 25%" value={horas25} onChange={setHoras25} />
          <NumberField label="Horas extras al 35%" value={horas35} onChange={setHoras35} />
        </div>
        <ResultCard
          rows={[
            { label: 'Valor de la hora normal', value: formatSoles(result.valorHora) },
            { label: 'Horas al 25%', value: formatSoles(result.pago25) },
            { label: 'Horas al 35%', value: formatSoles(result.pago35) },
            { label: 'Total horas extras', value: formatSoles(result.total), strong: true },
          ]}
          note="Referencial: valor hora = sueldo ÷ 30 ÷ horas de jornada."
        />
      </div>
    </ToolShell>
  )
}

export default CalculadoraHorasExtras

import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { DateField, NumberField, ResultCard, SelectField } from '../components/FormFields'
import {
  BONIF_EPS,
  BONIF_ESSALUD,
  formatSoles,
  liquidacion,
  parseDate,
  parseMoney,
  remuneracionComputable,
  type Tiempo,
} from '../lib/laboral'

const SEGUROS = [
  { value: 'essalud', label: 'EsSalud (9%)' },
  { value: 'eps', label: 'EPS (6.75%)' },
]

const describe = ({ months, days }: Tiempo) => `${months} m y ${days} d`

const CalculadoraLiquidacion = () => {
  const [ingreso, setIngreso] = useState('')
  const [cese, setCese] = useState('')
  const [sueldo, setSueldo] = useState('')
  const [asignacion, setAsignacion] = useState('')
  const [variables, setVariables] = useState('')
  const [seguro, setSeguro] = useState('essalud')

  const fechaIngreso = parseDate(ingreso)
  const fechaCese = parseDate(cese)
  const rem = remuneracionComputable({
    sueldo: parseMoney(sueldo),
    asignacionFamiliar: parseMoney(asignacion),
    variables: parseMoney(variables),
  })

  const valido = fechaIngreso && fechaCese && fechaCese >= fechaIngreso && rem > 0
  const result =
    valido && liquidacion(fechaIngreso, fechaCese, rem, seguro === 'eps' ? BONIF_EPS : BONIF_ESSALUD)

  return (
    <ToolShell
      currentHref="/calculadora-liquidacion"
      title="Calculadora de liquidación"
      subtitle="Estima tus beneficios sociales al terminar tu contrato: CTS, vacaciones y gratificación truncas."
    >
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField label="Fecha de ingreso" value={ingreso} onChange={setIngreso} />
          <DateField label="Fecha de cese" value={cese} onChange={setCese} />
          <NumberField label="Sueldo mensual (S/)" value={sueldo} onChange={setSueldo} />
          <NumberField label="Asignación familiar (S/)" value={asignacion} onChange={setAsignacion} />
          <NumberField
            label="Promedio de variables (S/)"
            value={variables}
            onChange={setVariables}
          />
          <SelectField label="Seguro de salud" value={seguro} onChange={setSeguro} options={SEGUROS} />
        </div>

        {result ? (
          <ResultCard
            rows={[
              { label: `CTS trunca (${describe(result.ctsPeriodo)})`, value: formatSoles(result.cts) },
              {
                label: `Vacaciones truncas (${describe(result.vacacionesPeriodo)})`,
                value: formatSoles(result.vacaciones),
              },
              {
                label: `Gratificación trunca (${result.gratificacionMeses} m)`,
                value: formatSoles(result.gratificacion.base),
              },
              {
                label: 'Bonificación extraordinaria',
                value: formatSoles(result.gratificacion.bonificacion),
              },
              { label: 'Total estimado', value: formatSoles(result.total), strong: true },
            ]}
            note="Referencial: asume que no gozaste vacaciones del último año y no incluye indemnización ni descuentos. No reemplaza una liquidación oficial."
          />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Completa las fechas y el sueldo para ver el cálculo.
          </p>
        )}
      </div>
    </ToolShell>
  )
}

export default CalculadoraLiquidacion

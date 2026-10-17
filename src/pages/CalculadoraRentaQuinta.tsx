import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { NumberField, ResultCard, SelectField } from '../components/FormFields'
import { BONIF_EPS, BONIF_ESSALUD, formatSoles, parseMoney } from '../lib/laboral'
import { rentaQuinta } from '../lib/planilla'

const SEGUROS = [
  { value: 'essalud', label: 'EsSalud' },
  { value: 'eps', label: 'EPS' },
]

const CalculadoraRentaQuinta = () => {
  const [sueldo, setSueldo] = useState('')
  const [otros, setOtros] = useState('')
  const [seguro, setSeguro] = useState('essalud')

  const r = rentaQuinta({
    sueldo: parseMoney(sueldo),
    otrosAnuales: parseMoney(otros),
    tasaBonificacion: seguro === 'eps' ? BONIF_EPS : BONIF_ESSALUD,
  })

  return (
    <ToolShell
      title="Calculadora de renta de quinta categoría"
      subtitle="Calcula el impuesto a la renta anual de tu sueldo y la retención de cada mes."
    >
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Sueldo bruto mensual (S/)" value={sueldo} onChange={setSueldo} />
          <SelectField label="Seguro de salud" value={seguro} onChange={setSeguro} options={SEGUROS} />
          <div className="sm:col-span-2">
            <NumberField label="Otros ingresos del año: bonos, utilidades (S/)" value={otros} onChange={setOtros} />
          </div>
        </div>
        <ResultCard
          rows={[
            { label: 'Renta bruta anual', value: formatSoles(r.brutaAnual) },
            { label: 'Deducción de 7 UIT', value: `− ${formatSoles(r.deduccion)}` },
            { label: 'Renta neta anual', value: formatSoles(r.netaAnual) },
            { label: 'Impuesto anual', value: formatSoles(r.impuestoAnual) },
            { label: 'Retención mensual aproximada', value: formatSoles(r.retencionMensual), strong: true },
          ]}
          note="Referencial, con UIT 2026 (S/ 5 500). Suma 12 sueldos, 2 gratificaciones con su bonificación extraordinaria y los otros ingresos. No incluye la deducción adicional de hasta 3 UIT por gastos sustentados."
        />
      </div>
    </ToolShell>
  )
}

export default CalculadoraRentaQuinta

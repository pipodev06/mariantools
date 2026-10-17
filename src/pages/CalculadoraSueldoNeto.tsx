import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { NumberField, ResultCard, SelectField } from '../components/FormFields'
import { BONIF_EPS, BONIF_ESSALUD, formatSoles, parseMoney } from '../lib/laboral'
import { AFPS, sueldoNeto, type AfpId } from '../lib/planilla'

const SISTEMAS = [
  { value: 'afp', label: 'AFP (sistema privado)' },
  { value: 'onp', label: 'ONP (sistema nacional)' },
]
const COMISIONES = [
  { value: 'flujo', label: 'Sobre el sueldo (flujo)' },
  { value: 'mixta', label: 'Mixta (sobre el saldo)' },
]
const SEGUROS = [
  { value: 'essalud', label: 'EsSalud' },
  { value: 'eps', label: 'EPS' },
]

const CalculadoraSueldoNeto = () => {
  const [sueldo, setSueldo] = useState('')
  const [sistema, setSistema] = useState('afp')
  const [afp, setAfp] = useState<string>('integra')
  const [comision, setComision] = useState('flujo')
  const [seguro, setSeguro] = useState('essalud')

  const bruto = parseMoney(sueldo)
  const r = sueldoNeto({
    sueldo: bruto,
    sistema: sistema as 'afp' | 'onp',
    afp: afp as AfpId,
    comision: comision as 'flujo' | 'mixta',
    tasaBonificacion: seguro === 'eps' ? BONIF_EPS : BONIF_ESSALUD,
  })

  const pensionRows =
    sistema === 'onp'
      ? [{ label: 'ONP (13 %)', value: `− ${formatSoles(r.aporte)}` }]
      : [
          { label: 'Aporte a tu fondo (10 %)', value: `− ${formatSoles(r.aporte)}` },
          { label: 'Prima de seguro', value: `− ${formatSoles(r.primaSeguro)}` },
          { label: 'Comisión de la AFP', value: `− ${formatSoles(r.comision)}` },
        ]

  return (
    <ToolShell
      title="Calculadora de sueldo neto"
      subtitle="Calcula cuánto recibes al mes después de AFP u ONP y la renta de quinta categoría."
    >
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <NumberField label="Sueldo bruto mensual (S/)" value={sueldo} onChange={setSueldo} />
          </div>
          <SelectField label="Sistema de pensiones" value={sistema} onChange={setSistema} options={SISTEMAS} />
          <SelectField label="Seguro de salud" value={seguro} onChange={setSeguro} options={SEGUROS} />
          {sistema === 'afp' && (
            <>
              <SelectField label="AFP" value={afp} onChange={setAfp} options={AFPS.map(({ value, label }) => ({ value, label }))} />
              <SelectField label="Tipo de comisión" value={comision} onChange={setComision} options={COMISIONES} />
            </>
          )}
        </div>
        <ResultCard
          rows={[
            { label: 'Sueldo bruto', value: formatSoles(bruto) },
            ...pensionRows,
            { label: 'Renta de quinta (retención)', value: `− ${formatSoles(r.quinta)}` },
            { label: 'Sueldo neto', value: formatSoles(r.neto), strong: true },
          ]}
          note="Referencial, régimen general, con valores 2026 (UIT S/ 5 500 y tasas de la SBS). No incluye otros descuentos como préstamos o cuotas sindicales."
        />
      </div>
    </ToolShell>
  )
}

export default CalculadoraSueldoNeto

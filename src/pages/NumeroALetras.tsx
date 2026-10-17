import { useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import ToolShell from '../components/ToolShell'
import { NumberField, ResultCard, SelectField } from '../components/FormFields'
import { writeClipboardText } from '../lib/clipboard'
import { parseMoney } from '../lib/laboral'
import { montoEnLetras, type Moneda } from '../lib/numeroALetras'
import { BUTTON_SECONDARY } from '../lib/ui'

const MONEDAS = [
  { value: 'soles', label: 'Soles' },
  { value: 'dolares', label: 'Dólares americanos' },
  { value: 'ninguna', label: 'Sin moneda' },
]

const NumeroALetras = () => {
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState('soles')
  const [copied, setCopied] = useState(false)

  const value = parseMoney(monto)
  const fueraDeRango = value >= 1_000_000_000_000
  const texto = monto.trim() && !fueraDeRango ? montoEnLetras(value, moneda as Moneda) : ''

  const copy = async () => {
    if (!(await writeClipboardText(texto))) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <ToolShell title="Número a letras" subtitle="Escribe un monto en letras para facturas, recibos y cheques.">
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Monto" value={monto} onChange={setMonto} />
          <SelectField label="Moneda" value={moneda} onChange={setMoneda} options={MONEDAS} />
        </div>
        {(texto || fueraDeRango) && (
          <div role="status" className="space-y-3">
            <ResultCard
              rows={[{ label: 'Son', value: fueraDeRango ? 'Monto demasiado grande' : texto, strong: true }]}
            />
            {texto && (
              <button type="button" onClick={copy} className={BUTTON_SECONDARY}>
                {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  )
}

export default NumeroALetras

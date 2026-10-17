import { useMemo, useState } from 'react'
import { IconDownload } from '@tabler/icons-react'
import ToolShell from '../components/ToolShell'
import ErrorNotice from '../components/ErrorNotice'
import { SelectField, TextField } from '../components/FormFields'
import { drawBarcode, encodeCode128, encodeEan13 } from '../lib/barcode'
import { BUTTON_PRIMARY } from '../lib/ui'

const TIPOS = [
  { value: 'ean13', label: 'EAN-13 (productos)' },
  { value: 'code128', label: 'Code 128 (texto y números)' },
]

const CodigoBarras = () => {
  const [tipo, setTipo] = useState('ean13')
  const [valor, setValor] = useState('')

  const { canvas, error } = useMemo(() => {
    if (!valor.trim()) return { canvas: null, error: '' }
    try {
      const result = tipo === 'ean13' ? encodeEan13(valor) : encodeCode128(valor)
      return { canvas: drawBarcode(result), error: '' }
    } catch (err) {
      return { canvas: null, error: err instanceof Error ? err.message : 'No se pudo generar el código' }
    }
  }, [tipo, valor])

  const download = () => {
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `codigo-de-barras-${tipo}.png`
    a.click()
  }

  return (
    <ToolShell title="Generador de códigos de barras" subtitle="Crea códigos EAN-13 o Code 128 y descárgalos en PNG.">
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <SelectField label="Tipo de código" value={tipo} onChange={setTipo} options={TIPOS} />
          <TextField
            label={tipo === 'ean13' ? 'Número (12 o 13 dígitos)' : 'Texto'}
            value={valor}
            onChange={setValor}
            maxLength={tipo === 'ean13' ? 13 : 80}
            inputMode={tipo === 'ean13' ? 'numeric' : 'text'}
          />
          {error && <ErrorNotice message={error} />}
        </div>
        {canvas && (
          <div className="space-y-3">
            {/* Fondo blanco fijo: el código debe verse igual que impreso, también en modo oscuro. */}
            <img
              src={canvas.toDataURL('image/png')}
              alt={`Código de barras ${tipo === 'ean13' ? 'EAN-13' : 'Code 128'}`}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800"
            />
            <button type="button" onClick={download} className={BUTTON_PRIMARY}>
              <IconDownload size={18} />
              Descargar PNG
            </button>
          </div>
        )}
      </div>
    </ToolShell>
  )
}

export default CodigoBarras

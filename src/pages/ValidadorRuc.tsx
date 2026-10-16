import { useState } from 'react'
import ToolShell from '../components/ToolShell'
import { ResultCard, TextField } from '../components/FormFields'
import { validarRuc } from '../lib/laboral'

const ValidadorRuc = () => {
  const [ruc, setRuc] = useState('')
  const digits = ruc.replace(/\s/g, '')
  const result = digits ? validarRuc(digits) : null

  return (
    <ToolShell
      currentHref="/validador-ruc"
      title="Validador de RUC"
      subtitle="Comprueba si un RUC peruano tiene un formato y un dígito verificador correctos."
    >
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TextField label="Número de RUC" value={ruc} onChange={setRuc} maxLength={11} />
        {result && (
          <div role="status">
            <ResultCard
              rows={[
                {
                  label: 'Resultado',
                  value: result.valido ? 'RUC válido' : 'RUC no válido',
                  strong: true,
                },
                ...(result.valido && result.tipo ? [{ label: 'Tipo', value: result.tipo }] : []),
                ...(result.motivo ? [{ label: 'Motivo', value: result.motivo }] : []),
              ]}
              note="Solo valida el formato y el dígito verificador. No confirma que el RUC exista ni su estado en SUNAT."
            />
          </div>
        )}
      </div>
    </ToolShell>
  )
}

export default ValidadorRuc

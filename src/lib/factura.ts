import { callAi } from './aiClient'
import { prepareImageForAi } from './ocr'

export type FacturaData = {
  fecha: string | null
  monto: string | null
  moneda: string | null
  ruc: string | null
  proveedor: string | null
  numero_comprobante: string | null
}

export const EMPTY_FACTURA_DATA: FacturaData = {
  fecha: null,
  monto: null,
  moneda: null,
  ruc: null,
  proveedor: null,
  numero_comprobante: null,
}

/** Le pide a la IA (vía `api/ai.ts`) un JSON estructurado con los datos de la factura o recibo. */
export const extractFacturaData = async (file: File): Promise<FacturaData> => {
  const raw = await callAi({ task: 'factura', image: await prepareImageForAi(file) })

  let parsed: Partial<FacturaData>
  try {
    parsed = JSON.parse(raw) as Partial<FacturaData>
  } catch {
    throw new Error('La IA no devolvió un JSON válido')
  }

  return {
    fecha: parsed.fecha ?? null,
    monto: parsed.monto ?? null,
    moneda: parsed.moneda ?? null,
    ruc: parsed.ruc ?? null,
    proveedor: parsed.proveedor ?? null,
    numero_comprobante: parsed.numero_comprobante ?? null,
  }
}

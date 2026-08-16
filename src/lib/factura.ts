const MAX_DIMENSION = 2000

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

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const compressImage = async (file: File): Promise<string> => {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo crear el contexto de canvas')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } catch {
    return fileToDataUrl(file)
  }
}

/**
 * Llama al backend propio (`api/factura-ai.ts`), que le pide a Mistral Pixtral
 * un JSON estructurado con los datos de la factura/recibo. La API key nunca
 * se expone al navegador.
 */
export const extractFacturaData = async (file: File): Promise<FacturaData> => {
  const image = await compressImage(file)

  const response = await fetch('/api/factura-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? 'No se pudo extraer los datos de la factura')
  }

  const { raw } = (await response.json()) as { raw: string }

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

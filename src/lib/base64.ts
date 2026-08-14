const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

const DEFAULT_MIME = 'image/png'

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export const mimeToExtension = (mime: string): string => MIME_EXTENSIONS[mime] ?? 'png'

export const estimateBytesFromBase64 = (base64: string): number => {
  const padding = (base64.match(/=+$/) ?? [''])[0].length
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

export type DecodedEntry = {
  dataUrl: string
  mime: string
  base64: string
}

/**
 * Acepta tanto una data URL completa (`data:image/png;base64,...`) como un
 * string base64 puro — en ese caso asume `image/png` (formato más común).
 * Lanza si el contenido no es base64 válido.
 */
export const parseBase64Entry = (raw: string): DecodedEntry => {
  const trimmed = raw.trim()
  const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s)
  const mime = match ? match[1] : DEFAULT_MIME
  const base64 = (match ? match[2] : trimmed).replace(/\s+/g, '')

  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error('Base64 inválido')
  }

  atob(base64)

  return { dataUrl: `data:${mime};base64,${base64}`, mime, base64 }
}

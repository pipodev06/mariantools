export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}

export const FORMAT_EXT: Record<ImageFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const canvasToBlob = (canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))),
      format,
      format === 'image/png' ? undefined : quality,
    )
  })

export const convertImage = async (
  file: File,
  format: ImageFormat,
  quality: number,
): Promise<{ blob: Blob; previewUrl: string }> => {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  // JPG no soporta transparencia — fondo blanco para que no quede negro.
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(bitmap, 0, 0)

  const blob = await canvasToBlob(canvas, format, quality / 100)
  return { blob, previewUrl: URL.createObjectURL(blob) }
}

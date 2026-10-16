import type { FileResult } from '../components/FileTransformTool'

export type Angle = 0 | 90 | 180 | 270
export type Flip = 'none' | 'horizontal' | 'vertical'

const OUTPUT_QUALITY = 0.92
const KEEP_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const baseName = (file: File) => file.name.replace(/\.[^.]+$/, '')

const toBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))),
      type,
      OUTPUT_QUALITY,
    ),
  )

// Si el original no es JPG, PNG ni WebP, se entrega en PNG.
const outputType = (file: File) => (KEEP_TYPES.includes(file.type) ? file.type : 'image/png')

/** Gira la imagen 90°, 180° o 270° y/o la voltea, conservando su formato. */
export const rotateFlipImage = async (file: File, angle: Angle, flip: Flip): Promise<FileResult> => {
  const bitmap = await createImageBitmap(file)
  const swap = angle === 90 || angle === 270
  const canvas = document.createElement('canvas')
  canvas.width = swap ? bitmap.height : bitmap.width
  canvas.height = swap ? bitmap.width : bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((angle * Math.PI) / 180)
  ctx.scale(flip === 'horizontal' ? -1 : 1, flip === 'vertical' ? -1 : 1)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)

  const type = outputType(file)
  return { blob: await toBlob(canvas, type), filename: `${baseName(file)}-editada.${EXT[type]}` }
}

export type CropArea = { x: number; y: number; width: number; height: number }

/** Recorta el área indicada (en píxeles de la imagen original); `round` deja un recorte circular en PNG. */
export const cropImage = async (file: File, area: CropArea, round: boolean): Promise<FileResult> => {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width)
  canvas.height = Math.round(area.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  if (round) {
    ctx.beginPath()
    ctx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2, 0, 0, Math.PI * 2)
    ctx.clip()
  }
  ctx.drawImage(bitmap, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)

  const type = round ? 'image/png' : outputType(file)
  return { blob: await toBlob(canvas, type), filename: `${baseName(file)}-recortada.${EXT[type]}` }
}

export type HeicTarget = 'image/jpeg' | 'image/png'

/** Convierte una foto HEIC/HEIF (iPhone) a JPG o PNG. La librería se carga solo al usarla (pesa ~2.7 MB). */
export const heicToImage = async (file: File, target: HeicTarget): Promise<FileResult> => {
  const { default: heic2any } = await import('heic2any')
  const output = await heic2any({ blob: file, toType: target, quality: OUTPUT_QUALITY })
  const blob = Array.isArray(output) ? output[0] : output
  return { blob, filename: `${baseName(file)}.${EXT[target]}` }
}

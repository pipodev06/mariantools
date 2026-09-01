export type ResizeMode = 'contain' | 'cover'

export type SocialPreset = {
  key: string
  label: string
  width: number
  height: number
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  { key: 'ig-post', label: 'Instagram post', width: 1080, height: 1080 },
  { key: 'ig-story', label: 'Instagram story', width: 1080, height: 1920 },
  { key: 'fb-post', label: 'Facebook post', width: 1200, height: 630 },
  { key: 'linkedin-banner', label: 'LinkedIn banner', width: 1584, height: 396 },
  { key: 'x-post', label: 'X (Twitter) post', width: 1600, height: 900 },
  { key: 'youtube-thumb', label: 'Miniatura de YouTube', width: 1280, height: 720 },
]

export const resizeImage = async (
  file: File,
  width: number,
  height: number,
  mode: ResizeMode,
  bgColor: string,
): Promise<string> => {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas')

  const scale =
    mode === 'contain'
      ? Math.min(width / bitmap.width, height / bitmap.height)
      : Math.max(width / bitmap.width, height / bitmap.height)

  const drawWidth = bitmap.width * scale
  const drawHeight = bitmap.height * scale
  const dx = (width - drawWidth) / 2
  const dy = (height - drawHeight) / 2

  if (mode === 'contain') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight)
  return canvas.toDataURL('image/png')
}

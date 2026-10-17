type PositionedText = { str: string; transform: number[]; width: number; height: number; hasEOL?: boolean }

/**
 * Une los fragmentos de la capa de texto según su posición. Algunos PDF guardan cada letra o sílaba
 * por separado: unirlos siempre con espacio rompía las palabras ("H o l a"). Aquí solo se pone espacio
 * si hay un hueco real entre fragmentos y salto de línea cuando cambia la altura del renglón.
 */
export const joinTextItems = (items: unknown[]): string => {
  let out = ''
  let prev: { right: number; y: number; size: number } | null = null
  for (const raw of items) {
    if (!raw || typeof raw !== 'object' || !('str' in raw)) continue
    const item = raw as PositionedText
    const x = item.transform[4]
    const y = item.transform[5]
    const size = Math.abs(item.height || item.transform[3]) || 10
    if (prev && item.str) {
      if (Math.abs(y - prev.y) > prev.size * 0.5) out += '\n'
      else if (x - prev.right > size * 0.2 && !/\s$/.test(out) && !/^\s/.test(item.str)) out += ' '
    }
    out += item.str
    if (item.hasEOL) {
      out += '\n'
      prev = null
    } else if (item.str) {
      prev = { right: x + item.width, y, size }
    }
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
}

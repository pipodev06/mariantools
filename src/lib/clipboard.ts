/** Copia texto al portapapeles. Devuelve false si el navegador lo bloquea (permiso, contexto no seguro, iOS). */
export const writeClipboardText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Respaldo para navegadores sin la API moderna.
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      area.remove()
    }
  }
}

/** Copia una imagen al portapapeles. Devuelve false si el navegador no lo permite (p. ej. Firefox sin ClipboardItem). */
export const writeClipboardImage = async (blob: Blob): Promise<boolean> => {
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
  } catch {
    return false
  }
}

// Últimas herramientas abiertas, guardadas solo en este navegador (localStorage) para mostrarlas en el Home.
const KEY = 'mariantools:recent'
const MAX_RECENT = 4

export const getRecent = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((h): h is string => typeof h === 'string') : []
  } catch {
    return []
  }
}

export const addRecent = (href: string) => {
  try {
    const next = [href, ...getRecent().filter((h) => h !== href)].slice(0, MAX_RECENT)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Sin localStorage (modo privado o bloqueado) simplemente no hay recientes.
  }
}

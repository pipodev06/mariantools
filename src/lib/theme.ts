import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'mariantools:theme'
const QUERY = '(prefers-color-scheme: dark)'

const listeners = new Set<() => void>()

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia(QUERY).matches ? 'dark' : 'light'
}

function current(): Theme {
  return readStored() ?? systemTheme()
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function emit() {
  apply(current())
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  const mq = window.matchMedia(QUERY)
  listeners.add(listener)
  // Sin elección guardada, sigue al sistema; con elección, `current()` la respeta.
  mq.addEventListener('change', emit)
  window.addEventListener('storage', emit)
  return () => {
    listeners.delete(listener)
    mq.removeEventListener('change', emit)
    window.removeEventListener('storage', emit)
  }
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Almacenamiento no disponible: el cambio solo dura la sesión.
  }
  apply(theme)
  listeners.forEach((l) => l())
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => 'light')
}

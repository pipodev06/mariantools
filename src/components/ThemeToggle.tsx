import { IconMoon, IconSun } from '@tabler/icons-react'
import { setTheme, useTheme } from '../lib/theme'
import { BUTTON_SECONDARY_BASE } from '../lib/ui'

/** Interruptor manual de tema claro/oscuro. */
const ThemeToggle = () => {
  const theme = useTheme()
  const isDark = theme === 'dark'
  const Icon = isDark ? IconSun : IconMoon

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={`${BUTTON_SECONDARY_BASE} p-2`}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}

export default ThemeToggle

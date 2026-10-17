import { defineConfig } from 'vitest/config'

// Configuración propia de las pruebas: no hereda los plugins de vite.config.ts y, sobre todo, no carga
// `.env.local` (envDir apunta a una carpeta sin archivos .env), así ninguna clave real llega a las pruebas.
export default defineConfig({
  envDir: './tests',
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})

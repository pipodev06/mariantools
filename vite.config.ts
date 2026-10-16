import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const MAX_DEV_BODY_BYTES = 10 * 1024 * 1024

const readJsonBody = async (stream: AsyncIterable<Buffer>) => {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of stream) {
    size += chunk.length
    if (size > MAX_DEV_BODY_BYTES) throw new Error('Cuerpo demasiado grande')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

// Sirve `api/*.ts` dentro de `pnpm dev` (mismo contrato que las funciones de Vercel), así no
// hace falta `vercel dev`. Las variables de `.env.local` quedan solo en `process.env` del
// servidor, nunca llegan al bundle del cliente.
const localApi = (): Plugin => ({
  name: 'local-api',
  apply: 'serve',
  configureServer(server) {
    const env = loadEnv(server.config.mode, server.config.root, '')
    for (const [key, value] of Object.entries(env)) process.env[key] ??= value

    server.middlewares.use(async (req, res, next) => {
      const name = req.url?.match(/^\/api\/([\w-]+)(?:\?.*)?$/)?.[1]
      if (!name || !existsSync(join(server.config.root, 'api', `${name}.ts`))) return next()

      const vercelRes = Object.assign(res, {
        status(code: number) {
          res.statusCode = code
          return vercelRes
        },
        json(body: unknown) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
          return vercelRes
        },
      })

      try {
        // Solo se parsea JSON; el audio crudo de /api/transcribe queda como stream.
        if (req.headers['content-type']?.includes('application/json')) {
          Object.assign(req, { body: await readJsonBody(req) })
        }
        const { default: handler } = await server.ssrLoadModule(`/api/${name}.ts`)
        await handler(req, vercelRes)
      } catch (err) {
        server.config.logger.error(String(err))
        if (!res.headersSent) vercelRes.status(500).json({ error: 'Error en la función local' })
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
})

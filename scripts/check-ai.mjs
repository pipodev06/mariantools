// Prueba cada proveedor de IA configurado (api/_providers.ts) con una llamada mínima.
// Uso: node --env-file=.env.local scripts/check-ai.mjs
// Imprime nombre, modelo, estado HTTP y tiempo; nunca la clave.
import { endpoint, getProviders } from '../api/_providers.ts'

// PNG de 1x1 píxel: basta para comprobar que el modelo acepta imágenes.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

// WAV de 1 s de silencio a 16 kHz mono, 16 bits.
const silentWav = () => {
  const samples = 16000
  const buf = Buffer.alloc(44 + samples * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + samples * 2, 4)
  buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(16000, 24)
  buf.writeUInt32LE(32000, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(samples * 2, 40)
  return buf
}

const run = async (label, providers, call) => {
  if (providers.length === 0) return console.log(`${label}: sin proveedores configurados`)
  for (const p of providers) {
    const t0 = Date.now()
    try {
      const res = await call(p)
      const detail = res.ok ? '' : ` ${(await res.text()).replace(/\s+/g, ' ').slice(0, 160)}`
      console.log(`${label} ${p.name} ${p.model}: ${res.ok ? 'OK' : 'FALLA'} ${res.status} ${Date.now() - t0} ms${detail}`)
    } catch (err) {
      console.log(`${label} ${p.name} ${p.model}: FALLA ${err instanceof Error ? err.name : err}`)
    }
  }
}

await run('imagen', getProviders('chat'), (p) =>
  fetch(endpoint(p, '/chat/completions'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${p.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: p.model,
      max_tokens: 20,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Responde solo con este JSON: {"ok": true}' },
            { type: 'image_url', image_url: { url: PNG } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  }),
)

await run('audio', getProviders('audio'), (p) => {
  const form = new FormData()
  form.append('model', p.model)
  form.append('file', new Blob([silentWav()], { type: 'audio/wav' }), 'audio.wav')
  return fetch(endpoint(p, '/audio/transcriptions'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${p.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(20_000),
  })
})

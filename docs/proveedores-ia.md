# Proveedores de IA con rotación (2026-10-16)

`api/_providers.ts` lee varios proveedores compatibles con OpenAI y reparte las llamadas entre ellos al azar. Ante un 429, un error de servidor, un modelo sin soporte o un tiempo agotado, pasa al siguiente. Si uno tarda más de 5 s, lanza el siguiente en paralelo y gana el primero que responda. Todo dentro de los 30 s de la función; con un solo proveedor reintenta una vez.

El navegador achica las imágenes a 1600 px (JPEG 0,8) antes de subirlas a la IA y `callAi` guarda en memoria el resultado por archivo y opciones (40 entradas), así que repetir el mismo uso es instantáneo y no gasta cupo.

## Variables (solo nombres; los valores van en Vercel / `.env.local`)

Texto y visión (`api/ai.ts`), hasta 6 proveedores:

- `AI_1_API_KEY`, `AI_1_BASE_URL`, `AI_1_MODEL`; luego `AI_2_*`, `AI_3_*` …

Audio (`api/transcribe.ts`):

- `AI_AUDIO_1_API_KEY`, `AI_AUDIO_1_BASE_URL`, `AI_AUDIO_1_MODEL`; luego `AI_AUDIO_2_*` …

Sin numerados siguen valiendo `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` (y `AI_AUDIO_*`) como único proveedor.

## Para liberar sin login y sin pagar

- El cupo gratis por IP (`FREE_DAILY_USES`) funciona sin sesión y necesita `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: sin ellas la IA responde 503 en producción (y en desarrollo no se mide). Todos los que comparten una IP (una oficina) comparten ese cupo: subir `FREE_DAILY_USES` mientras dure la prueba.
- Cada proveedor gratuito tiene límites por minuto y por día; con varios, el total suma. Revisar los límites y los términos vigentes en el panel de cada uno antes de configurarlos.
- Muchos planes gratuitos permiten usar los datos enviados para mejorar sus modelos: revisar eso contra lo que dice `/privacidad` antes de abrir al público.
- Validar la configuración: `node --env-file=.env.local scripts/check-ai.mjs` prueba cada proveedor (imagen + JSON, y audio) y muestra estado y tiempo, sin imprimir claves.
- Todos los proveedores de la lista deben aceptar imágenes (visión) para OCR, facturas, manuscrito, tabla y traducir imagen; el de audio debe exponer `/audio/transcriptions`.

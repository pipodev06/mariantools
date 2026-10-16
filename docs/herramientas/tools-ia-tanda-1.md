# Tools con IA — tanda 1 (2026-10-16)

Manuscrito a texto (`/manuscrito`), Extractor de tablas (`/extractor-tablas`), Traductor de imagen (`/traductor-imagen`), Corrector ortográfico (`/corrector`), Resumen de texto (`/resumen`).

- **Backend único**: `api/ai.ts` recibe `{ task, image? | text?, lang?, length? }`. Los prompts viven en el servidor (por tarea, con whitelist de idiomas/largos) para que el endpoint no sirva de proxy libre a Mistral. Modelo `mistral-small-latest`. Respuesta `{ result: string }`. Desde 2026-10-16 también cubre `ocr` y `factura` (se eliminaron `api/ocr-ai.ts` y `api/factura-ai.ts`). Validación: imagen solo `data:image/(jpeg|png|webp);base64,` de hasta 4 MB, errores genéricos al cliente (solo 429 se expone; el detalle de Mistral va a `console.error`), timeout de 25 s. Cliente: `src/lib/aiClient.ts` (`callAi`).

**Seguridad pendiente de panel (no es código)**: regla de rate limit en Vercel Firewall (`/api/*` POST, ~40/min por IP) y tope de gasto mensual en la consola de Mistral. Cabeceras de seguridad en `vercel.json` (CSP completa pendiente hasta probar AdSense en modo Report-Only).
- **Cliente**: `src/lib/ai.ts` (una función por tarea + `tableToCsv`). Las imágenes se achican con `prepareImageForAi` de `src/lib/ocr.ts`.
- **Componentes compartidos** (no reimplementar por página):
  - `components/ImageAiTool.tsx` — dropzone + lista + resultados por archivo (copiar/descargar). Genérico `<T>`: `run`, `toText`, `renderResult?`, `controls?`, `downloadExt`.
  - `components/TextAiTool.tsx` — textarea de entrada/salida, `controls?`, límite `MAX_AI_TEXT_LENGTH` (20000, igual que el servidor).
- La tabla extraída se descarga como CSV con BOM (Excel).

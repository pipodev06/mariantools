# MarianTools

Suite de 46 herramientas web gratis para trabajar con archivos: OCR, PDF, imágenes, texto y calculadoras laborales de Perú. La mayoría corre en el navegador y el archivo no sale del equipo.

## Qué hace
- **Extracción:** facturas y recibos a CSV (fecha, monto, RUC, proveedor), imagen, PDF, audio y manuscrito a texto, y extractor de tablas.
- **PDF:** escanear con la cámara, unir, dividir, reordenar, firmar, comprimir, rotar, numerar, recortar, y convertir a JPG o Word.
- **Imagen:** quitar fondo, traducir, comprimir a un peso exacto, redimensionar, recortar, HEIC a JPG, marca de agua, EXIF y paleta de colores.
- **Texto:** resumen, corrector ortográfico, comparador, contador de palabras, texto a voz y Markdown a PDF/Word.
- **Calculadoras de Perú:** sueldo neto, renta de quinta, CTS, gratificación, liquidación, horas extras, IGV y días hábiles (referenciales, régimen general).
- **Utilidades:** número a letras, códigos de barras, QR, validador de RUC y contraseñas seguras.
- Las herramientas con IA tienen usos gratis cada día; después usan créditos.

## Tecnologías
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS v4 · Procesamiento local: Tesseract.js, pdf.js, pdf-lib, Transformers.js
- Backend: funciones serverless de Vercel (`api/`) con cualquier API de IA compatible con OpenAI, con rotación y respaldo entre proveedores
- Base de datos: Supabase (cuentas, créditos y comentarios) · Hosting: Vercel

## Requisitos
- Node 20+ y pnpm

## Cómo levantarlo
1. `git clone https://github.com/pipodev06/mariantools.git && cd mariantools`
2. `cp .env.example .env.local` y completar las variables (ver Configuración). Las herramientas locales funcionan sin ninguna.
3. `pnpm install`
4. `pnpm dev` → abre en http://localhost:5173 (también sirve `/api/*`)

Otros comandos: `pnpm build` (type-check, build y prerender de cada ruta con `sitemap.xml`), `pnpm lint`, `pnpm test` y `pnpm preview`.

## Configuración
| Variable | Para qué | Ejemplo de formato |
|---|---|---|
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Proveedor de IA para texto e imágenes | `AI_BASE_URL=https://api.groq.com/openai/v1` |
| `AI_1_*` … `AI_6_*` | Varios proveedores con rotación: si uno falla o tarda, se usa el siguiente | mismos tres campos por proveedor |
| `AI_AUDIO_API_KEY`, `AI_AUDIO_BASE_URL`, `AI_AUDIO_MODEL` | Audio a texto (si faltan clave y URL, usa las de `AI_*`) | API compatible con `/audio/transcriptions` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Créditos y cupo gratis (la service role es secreta: solo servidor) | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Login en el navegador (la anon key es pública) | `https://<ref>.supabase.co` |
| `FREE_DAILY_USES`, `BILLING_SALT` | Usos gratis de IA por día y sal para hashear IPs | número · texto aleatorio largo |

Las claves solo las leen las funciones de `api/`; nunca llegan al navegador. Para probar los proveedores configurados (no imprime claves): `node --env-file=.env.local scripts/check-ai.mjs`.

## Despliegue
Vercel: importa el repo y carga las mismas variables en *Project Settings → Environment Variables*. Las migraciones de Supabase están en `supabase/migrations/`.

Sitio: https://mariantools.vercel.app

## Licencia
[MIT](LICENSE).

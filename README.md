# MarianTools

**46 herramientas web gratis para trabajar con archivos:** OCR, PDF, imágenes, texto y calculadoras laborales de Perú. La mayoría corre 100% en el navegador (el archivo no sale del equipo); las que necesitan comprensión de lenguaje usan IA con usos gratis cada día.

🌐 [mariantools.vercel.app](https://mariantools.vercel.app) · dominio final previsto: `www.mariantools.com`

El proyecto nació como un "OCR para contadores": extraer datos de facturas y recibos automáticamente. **Facturas y recibos** sigue siendo la herramienta fundacional, y el resto de la suite creció alrededor de esa idea: utilidades rápidas y sin fricción para el día a día.

## Herramientas

🖥️ = local, en el navegador · ✨ = IA (usos gratis al día, luego créditos)

| Categoría | Herramientas |
|---|---|
| **Extracción** | ✨ Facturas y recibos (fecha, monto, RUC, proveedor → CSV) · 🖥️✨ Imagen a texto (OCR local o con IA) · 🖥️ PDF a texto (con OCR para escaneos) · ✨ Audio a texto · ✨ Manuscrito a texto · ✨ Extractor de tablas (→ CSV) |
| **PDF** | Escanear documento con la cámara (corrige la perspectiva) · Imagen a PDF · Editor (unir, dividir, reordenar) · Firma · Comprimir · PDF a JPG · PDF a Word · Rotar · Numerar páginas · Recortar márgenes — todas 🖥️ |
| **Imagen** | 🖥️ Quitar fondo (modelo en el navegador) · ✨ Traductor de imagen · Comprimir/convertir (a peso exacto en KB) · Redimensionar para redes · Recortar · Rotar y voltear · HEIC a JPG · Marca de agua · Base64 · Metadatos EXIF · Paleta de colores |
| **Texto** | ✨ Resumen · ✨ Corrector ortográfico · 🖥️ Comparador de textos · 🖥️ Contador de palabras · 🖥️ Texto a voz · 🖥️ Markdown a PDF/Word |
| **Calculadoras (Perú)** | Sueldo neto (AFP/ONP y quinta) · Renta de quinta categoría · CTS · Gratificación · Liquidación · Horas extras · IGV · Fechas y días hábiles — todas 🖥️, régimen general, referenciales |
| **Utilidades** | Número a letras (facturas y cheques) · Códigos de barras EAN-13 y Code 128 · Generador/lector QR · Validador de RUC · Contraseñas seguras — todas 🖥️ |

### Motores locales

- **OCR (Tesseract.js, español + inglés):** detecta la orientación, agranda el texto chico hasta ~32 px de alto, endereza la inclinación, invierte capturas en modo oscuro y binariza con umbral adaptativo. Descarta las líneas dudosas (textura de fotos que Tesseract lee como símbolos) y, si la lectura sale débil, prueba en grises suavizados y se queda con la que tenga más texto confiable.
- **PDF a texto / Word:** une los fragmentos de la capa de texto por su posición (sin palabras partidas en letras sueltas) y pasa las páginas escaneadas por el OCR a ~216 DPI.
- **Lector QR:** lector nativo del navegador cuando existe (`BarcodeDetector`) y jsQR a varias escalas, con margen blanco añadido y soporte de QR invertidos.
- **Paleta:** k-means en espacio CIELAB (distancia perceptual) con fusión de tonos casi iguales.

## Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript, [Tailwind CSS v4](https://tailwindcss.com/), [react-router-dom](https://reactrouter.com/) v7, [@tabler/icons-react](https://tabler.io/icons)
- Procesamiento local: [Tesseract.js](https://github.com/naptha/tesseract.js), [pdf.js](https://mozilla.github.io/pdf.js/), [pdf-lib](https://pdf-lib.js.org/), [jsPDF](https://github.com/parallax/jsPDF), [docx](https://docx.js.org/), [jsQR](https://github.com/cozmo/jsQR), [exifr](https://github.com/MikeKovarik/exifr), [Transformers.js](https://huggingface.co/docs/transformers.js) (quitar fondo)
- IA: cualquier API compatible con OpenAI, configurada solo por variables de entorno, con **rotación entre varios proveedores y respaldo en paralelo** (`api/_providers.ts`)
- Cuentas y créditos: [Supabase](https://supabase.com/) (Auth con Google o código por correo, saldo, cupo gratis diario, comentarios)
- Despliegue en [Vercel](https://vercel.com/) con prerender por ruta (SEO) y funciones serverless en `api/`
- Tipografía Manrope + Sora, self-hosted; modo claro y oscuro

## Estructura

```
api/                 Funciones serverless (los archivos con _ no son endpoints)
  ai.ts              Tareas de IA (ocr, factura, manuscrito, tabla, traducir, corregir, resumir)
  transcribe.ts      Audio a texto
  _providers.ts      Rotación y respaldo entre proveedores de IA
  _billing.ts        Reserva y devolución de créditos / cupo gratis
src/
  pages/             Una página por herramienta
  components/        Componentes compartidos (ToolCard, Select, FileTransformTool, ...)
  lib/               Lógica client-side (ocr, pdfText, qrDecode, palette, ...)
  data/              Catálogo (tools.ts), SEO (seo.ts), ayuda de cada herramienta (toolInfo.ts)
scripts/             prerender.mjs (HTML por ruta + sitemap) y check-ai.mjs (prueba los proveedores)
supabase/migrations/ Esquema de créditos y comentarios
docs/                Decisiones y configuración (auth, créditos, proveedores de IA, herramientas)
AGENTS.md            Convenciones de diseño y código congeladas (fuente de verdad)
```

## Empezar

```bash
pnpm install
cp .env.example .env.local   # completar las variables
pnpm dev                     # http://localhost:5173, también sirve /api/*
```

Las herramientas locales funcionan sin ninguna variable. Para las de IA y los créditos hacen falta:

- **IA:** `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` (o varios proveedores con `AI_1_*`, `AI_2_*` …) y `AI_AUDIO_*` para audio. Detalle en [`docs/proveedores-ia.md`](docs/proveedores-ia.md).
- **Supabase:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `FREE_DAILY_USES`, `BILLING_SALT`.

Las claves solo las leen las funciones de `api/`; nunca llegan al navegador. Para validar los proveedores configurados:

```bash
node --env-file=.env.local scripts/check-ai.mjs
```

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con `/api/*` incluido |
| `pnpm build` | Type-check + build + prerender de cada ruta y `sitemap.xml` |
| `pnpm lint` | ESLint |
| `pnpm test` | Pruebas automáticas (Vitest): calculadoras, codificadores, motores locales y rotación de IA |
| `pnpm preview` | Sirve el build localmente |

## Convenciones

Las decisiones de estilo (paleta, tipografía, componentes, anchos, motion, accesibilidad, móvil) están documentadas en [`AGENTS.md`](./AGENTS.md). Toda herramienta nueva se registra en `src/data/tools.ts`, `src/data/seo.ts`, `src/data/toolInfo.ts` y su ruta en `App.tsx`.

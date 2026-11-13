<div align="center">

# MarianTools

46 herramientas web gratis para trabajar con archivos: OCR, PDF, imágenes, texto y calculadoras laborales de Perú.

![React](https://img.shields.io/badge/React-19-087ea4)
![Vite](https://img.shields.io/badge/Vite-8-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-créditos-3ecf8e)
![Licencia](https://img.shields.io/badge/licencia-MIT-2da44e)

[Sitio](https://mariantools.vercel.app) · [Funciones](#funciones) · [Instalación](#instalación) · [Configuración](#configuración) · [Despliegue](#despliegue)

</div>

## Funciones

| Extracción | PDF |
|---|---|
| Facturas y recibos a CSV (fecha, monto, RUC, proveedor) · imagen, PDF, audio y manuscrito a texto · extractor de tablas | Escanear con la cámara · unir · dividir · reordenar · firmar · comprimir · rotar · numerar · recortar · convertir a JPG o Word |
| **Imagen** | **Texto** |
| Quitar fondo · traducir · comprimir a un peso exacto · redimensionar · recortar · HEIC a JPG · marca de agua · EXIF · paleta de colores | Resumen · corrector ortográfico · comparador · contador de palabras · texto a voz · Markdown a PDF/Word |
| **Calculadoras de Perú** | **Utilidades** |
| Sueldo neto · renta de quinta · CTS · gratificación · liquidación · horas extras · IGV · días hábiles (referenciales, régimen general) | Número a letras · códigos de barras · QR · validador de RUC · contraseñas seguras |

La mayoría de herramientas corre en tu navegador y el archivo no sale del equipo. Las que usan IA tienen usos gratis cada día; después usan créditos.

## Tecnologías

| Pieza | Tecnología |
|---|---|
| Interfaz | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Procesamiento local | Tesseract.js, pdf.js, pdf-lib, Transformers.js |
| Backend | Funciones serverless de Vercel (`api/`) con cualquier API de IA compatible con OpenAI, con rotación y respaldo entre proveedores |
| Base de datos | Supabase (cuentas, créditos y comentarios) |
| Hosting | Vercel |

## Instalación

Necesitas Node 20 o más y pnpm.

```bash
git clone https://github.com/pipodev06/mariantools.git && cd mariantools
cp .env.example .env.local        # opcional: las herramientas locales funcionan sin variables
pnpm install
pnpm dev                          # http://localhost:5173 (también sirve /api/*)
```

1. Abre http://localhost:5173 y elige una herramienta.

Otros comandos: `pnpm build` (type-check, build y prerender de cada ruta con `sitemap.xml`), `pnpm lint`, `pnpm test` y `pnpm preview`.

## Configuración

Las variables van en `.env.local` y solo hacen falta para las herramientas con IA y los créditos.

| Variable | Para qué |
|---|---|
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Proveedor de IA para texto e imágenes (ej. `AI_BASE_URL=https://api.groq.com/openai/v1`) |
| `AI_1_*` … `AI_6_*` | Varios proveedores con rotación: si uno falla o tarda, se usa el siguiente |
| `AI_AUDIO_API_KEY`, `AI_AUDIO_BASE_URL`, `AI_AUDIO_MODEL` | Audio a texto (si faltan clave y URL, usa las de `AI_*`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Créditos y cupo gratis, solo en el servidor |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Login en el navegador (la anon key es pública) |
| `FREE_DAILY_USES`, `BILLING_SALT` | Usos gratis de IA por día y sal para hashear IPs |

> [!WARNING]
> - La `service_role` nunca lleva prefijo `VITE_`: quedaría pública en el navegador. Va solo en `SUPABASE_SERVICE_ROLE_KEY`, que leen las funciones de `api/`.
> - Sin variables de IA, las herramientas con IA no responden; las locales siguen funcionando.
> - Para probar un proveedor sin imprimir claves: `node --env-file=.env.local scripts/check-ai.mjs`.

## Despliegue

En Vercel: importa el repo y carga las mismas variables en *Project Settings → Environment Variables*. Las migraciones de Supabase están en `supabase/migrations/`.

## Licencia

[MIT](LICENSE).

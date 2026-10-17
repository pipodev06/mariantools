# MarianTools

Suite de herramientas web gratuitas para trabajar con archivos — OCR, imágenes, texto y más — corriendo 100% en el navegador cuando es posible, y con IA para lo que necesita más que reconocimiento básico.

La idea original del proyecto fue construir un "OCR para contadores": extraer datos de facturas y recibos automáticamente. Esa sigue siendo la herramienta fundacional (**Facturas y recibos**), y el resto de la suite creció alrededor de esa misma idea — utilidades chicas, rápidas y sin fricción para tareas del día a día con archivos.

## Herramientas disponibles

| Herramienta | Ruta | Qué hace |
|---|---|---|
| Imagen a texto | `/ocr` | OCR de imágenes con dos motores a elección: Tesseract.js (rápido, 100% en el navegador) o IA ( entiende columnas/gráficos). Soporta varios archivos a la vez. |
| Imagen a Base64 | `/base64` | Codifica imágenes a Base64 (Data URL o base64 puro) o decodifica de vuelta a imagen. Bidireccional, 100% client-side. |
| Contraseñas seguras | `/contrasenas` | Generador de contraseñas con modo Random (charset configurable) o Memorable (passphrase estilo diceware, wordlist BIP39). `crypto.getRandomValues`, nunca `Math.random`. |
| Generador/lector QR | `/qr` | Genera códigos QR (texto, URL, WiFi, contacto vCard) con color personalizable, o lee uno desde una imagen. |
| Comparador de textos | `/comparador` | Diferencias entre dos textos, por palabra o por línea, resaltadas. |
| Paleta de colores | `/paleta` | Extrae los colores dominantes de una imagen (cuantización manual con Canvas API, sin dependencias). |
| Facturas y recibos | `/facturas` | Extrae fecha, monto, RUC, proveedor y N° de comprobante de facturas/recibos con IA, en lote, exportable a CSV. |
| Comprimir/convertir imagen | `/comprimir` | Convierte entre JPG, PNG y WebP con calidad ajustable, en lote. |
| Imagen a PDF | `/imagen-a-pdf` | Junta varias imágenes en un solo PDF, con reordenamiento. |
| Redimensionar para redes | `/redimensionar` | Presets para Instagram, Facebook, LinkedIn, X e YouTube, con recorte o ajuste. |
| Marca de agua | `/marca-de-agua` | Marca de agua de texto sobre imágenes o todas las páginas de un PDF. |
| Metadatos EXIF | `/exif` | Cámara, fecha y ubicación GPS (si existe) de una foto, exportable a JSON. |
| Editor de PDF | `/editor-pdf` | Une varios PDF, reordena o elimina páginas, extrae una página como PDF aparte. |
| Firma digital en PDF | `/firma-pdf` | Dibuja tu firma y colócala en cualquier página del PDF. |
| Texto a voz | `/texto-a-voz` | Lee un texto en voz alta con las voces del navegador (Web Speech API). |
| Markdown a PDF/Word | `/markdown` | Convierte Markdown a un PDF o `.docx` con formato. |
| Calculadora de fechas | `/calculadora-fechas` | Diferencia entre dos fechas (con días hábiles) o sumar/restar días a una fecha. |

Todas las de esta lista corren 100% en el navegador — ninguna depende de una API de IA salvo Imagen a texto (motor IA opcional) y Facturas y recibos.

Ver `tools.md` para el catálogo completo, incluidas las herramientas planeadas que sí necesitan IA ("Próximamente" en la página de inicio: Extractor de tablas, Manuscrito a texto, Traductor de imagen, Resumen de texto, etc.).

## Stack

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first, sin `tailwind.config`)
- [react-router-dom](https://reactrouter.com/) v7
- [@tabler/icons-react](https://tabler.io/icons) para íconos
- [Tesseract.js](https://github.com/naptha/tesseract.js) para OCR local
- Proveedor de IA intercambiable (cualquier API compatible con OpenAI, configurado por variables `AI_*`) para OCR/extracción/transcripción, vía funciones serverless propias
- [pdf-lib](https://pdf-lib.js.org/) (editar/unir/firmar/marca de agua en PDF), [jsPDF](https://github.com/parallax/jsPDF) (generar PDF desde imágenes o Markdown), [docx](https://docx.js.org/) (generar `.docx`), [marked](https://marked.js.org/) (parseo de Markdown), [exifr](https://github.com/MikeKovarik/exifr) (metadatos EXIF)
- Fuente self-hosted: Manrope + Sora (@fontsource-variable)
- Despliegue en [Vercel](https://vercel.com/)

## Estructura del proyecto

```
api/                    Funciones serverless (Vercel) que hablan con el proveedor de IA
  ai.ts                 Tareas de IA (ocr, factura, manuscrito, tabla, traducir, corregir, resumir)
  transcribe.ts         Audio a texto (Voxtral)
src/
  pages/                Una página por herramienta (Ocr.tsx, Contrasenas.tsx, ...)
  components/           Componentes compartidos (Header, Footer, ToolCard, OtherTools, PreviewModal)
  lib/                  Lógica de negocio client-side (ocr.ts, base64.ts, palette.ts, factura.ts, pdfEditor.ts, watermark.ts, signature.ts, markdownExport.ts, resize.ts, imageConvert.ts, imageToPdf.ts, wordlist.ts)
  data/tools.ts          Catálogo centralizado de herramientas (disponibles / próximamente)
  layout/               MainLayout con Header/Footer
tools.md                Documento de planificación del catálogo de herramientas
CLAUDE.md               Convenciones de diseño/código congeladas del proyecto (fuente de verdad para estilo)
```

## Empezar

```bash
pnpm install
pnpm dev          # http://localhost:5173 — no sirve /api/*
```

Las herramientas 100% client-side (Ocr en modo Rápido, Base64, Contraseñas, Qr, Comparador, Paleta) funcionan con `pnpm dev` normal. Las que dependen de un motor de IA (Ocr en modo IA, Facturas) necesitan las funciones serverless de `api/`:

```bash
pnpm dev:vercel   # vercel dev — sirve también /api/*, requiere `vercel` CLI
```

### Variables de entorno

Crear `.env.local` en la raíz copiando `.env.example` y rellenando las variables `AI_*` (proveedor, URL base y modelo; el de audio puede ser otro). Para cambiar de proveedor o de modelo solo se editan estas variables, no el código.

Nunca se exponen al cliente — solo las leen las funciones serverless en `api/`.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (Vite) |
| `pnpm dev:vercel` | Servidor de desarrollo con funciones `/api/*` (Vercel CLI) |
| `pnpm build` | Type-check (`tsc -b`) + build de producción |
| `pnpm lint` | ESLint sobre todo el proyecto |
| `pnpm preview` | Sirve el build de producción localmente |

## Despliegue

El proyecto está desplegado en Vercel. `pnpm build` prerenderiza cada ruta (`dist/<ruta>/index.html`) y genera `dist/404.html`: Vercel responde con ese archivo y estado 404 a las rutas inexistentes. `/api/*` son funciones de Vercel.

## Convenciones de diseño y código

Todas las decisiones de estilo (paleta de colores, tipografía, patrones de componentes, anchos de contenedor, motion/accesibilidad) están documentadas y congeladas en [`CLAUDE.md`](./CLAUDE.md). Es la referencia obligatoria antes de tocar cualquier página o componente nuevo — evita reinventar patrones que ya existen en el proyecto.

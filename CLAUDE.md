# MarianTools

Suite de herramientas (OCR, PDF, imagen, texto, etc.). Ver `tools.md` para catálogo completo.

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4 (import directo, sin `tailwind.config`)
- react-router-dom v7
- @tabler/icons-react — íconos, ver lista curada abajo
- `vercel.json` — rewrite catch-all (`/(.*) → /index.html`) para que rutas hijas de React Router (ej. `/ocr`) no den 404 al refrescar en Vercel. No afecta `/api/*`: Vercel prioriza funciones/archivos reales sobre los rewrites.

## Copy / idioma

Español neutro tipo Perú (PE) — **nunca voseo argentino**. "transcribe" no "transcribí", "genera" no "generá", "crea"/"lee" no "creá"/"leé", etc. Usar conjugación de tercera persona/imperativo neutro, no vos. Aplica a todo texto de UI (`tools.ts`, páginas, componentes). `tools.md` es documento de planificación del usuario, no se toca.

## Tipografía

Fuente principal: **Comfortaa**, self-hosted (no Google Fonts CDN) desde `src/assets/fonts/comfortaa/*.ttf`, declarada vía `@font-face` en `src/index.css` y seteada como `--font-sans` (Tailwind v4 la propaga a `html`/body vía preflight, sin tocar `App.tsx`). Solo se guardan los 3 pesos que realmente se usan en el código — `Regular`(400) para texto normal, `SemiBold`(600) para `font-semibold`, `Bold`(700) para `font-bold`. `Light` y `Medium` se borraron por no usarse. Si se necesita un peso nuevo, agregar el `.ttf` a esa carpeta + su `@font-face` correspondiente (no reintroducir el import de Google Fonts).

## Estilo/diseño

`App.tsx` sin `className` por pedido explícito del usuario — HTML plano, sin Tailwind. No agregar clases ahí salvo que el usuario lo pida de nuevo. `Header.tsx` y `Footer.tsx` salen de esta regla (pedidos explícitos posteriores de estilarlos).

Escala tipográfica (congelada, normalizada — solo pasos estándar de Tailwind, nada arbitrario tipo `text-[Npx]`): `text-xs`(12) `text-sm`(14) `text-base`(16) `text-lg`(18) `text-xl`(20) `text-2xl`(24) `text-3xl`(30) `text-4xl`(36) `text-5xl`(48). Uso: hero H1 `4xl→5xl`, subtítulo de sección `2xl→3xl`, marca de Header / título de card `lg`, párrafo de hero `lg`, descripción de card `base`, nav/footer/CTA `sm`, cinta "Pronto" `xs`.

Paleta (congelada, elegida por el usuario entre 4 opciones — "Emerald + Slate"):

- Escala neutra: `slate`. Texto muted `-500` / primario `-800`, regla global. En dark: `slate-400` (muted) / `slate-100` (primario). Excepción: copy principal del hero usa `-800`/`-100` en vez de `-500`/`-400` — con muted quedaba casi invisible sobre el fondo de la card.
- Acento: `emerald-600` (dark: `emerald-400`) — único color de marca/CTA/links/hover. No mezclar con blue ni otro acento.
- Botón primario (CTA): `bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg`.
- Header: **sticky** (`sticky top-0 z-50`), `border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`, contenedor `mx-auto max-w-5xl flex items-center justify-between px-6 py-4`, marca `slate-800`/`slate-100` (no acento), nav link `slate-500` con `hover:text-emerald-600`.
- Footer: mismo contenedor/borde que Header (`border-t` en vez de `border-b`), texto centrado `slate-500`/`slate-400`.
- Fondo de páginas: `<main>` en `MainLayout.tsx` lleva `bg-slate-100 dark:bg-slate-950` (fondo ligero, distinto del blanco de Header/Footer). Header y Footer se mantienen `bg-white`/`dark:bg-slate-900` para marcar el límite del layout.
- Card/hero: **glassmorphism** (elegido por el usuario entre glassmorphism vs. blur decorativo) — `bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/40`, con gradiente decorativo detrás (`bg-linear-to-br from-emerald-200/40 via-transparent to-slate-200/40` (Tailwind v4 renombró `bg-gradient-to-*` → `bg-linear-to-*`, usar siempre la sintaxis nueva), posicionado `absolute inset-0 -z-10` dentro de un contenedor `relative overflow-hidden`). Este patrón de gradiente+glass es el que se repite en cualquier card destacada futura.
- Contenedor de página: `mx-auto max-w-5xl px-6 py-16`.
- Dark mode vía `prefers-color-scheme` (sin toggle manual).
- **ToolCard** (`src/components/ToolCard.tsx`): componente único para tarjetas de herramienta, reusar siempre en vez de reimplementar (ej. en `Herramientas.tsx`). Props vienen de `Tool` en `src/data/tools.ts` (`title`, `description`, `href?`, `category?`) + `comingSoon?`. Si tiene `href` y no es `comingSoon`, la card entera es `Link`. Card cuadrada (`aspect-square`), contenido centrado verticalmente: ícono → nombre → descripción (`line-clamp-3`). `category` no se muestra en la card (queda en el dato para uso futuro, ej. filtros). Badge "Próximamente" es una **cinta diagonal (ribbon)** en la esquina superior derecha (elegida entre 5 opciones: franja inferior sólida, gradiente, ghost/outline, ribbon, punto+texto): `absolute -right-9 top-4 w-32 rotate-45 bg-slate-800 dark:bg-slate-700 text-white text-xs uppercase`, texto "Pronto", recortada por el `overflow-hidden` de la card. Color `slate` (no `amber`) para no salirse de la paleta congelada Emerald + Slate. No usa `opacity-60` en la card. Ícono `size={44} stroke={1.5}`. Nombre `text-lg font-semibold`, descripción `text-base`. Descripciones de `Tool` son frases cortas (2-5 palabras, ej. "Con OCR e IA para conversiones"), no oraciones completas — ver `src/data/tools.ts`.
- Secciones de cards (`Herramientas disponibles` / `Próximamente`): contenedor más ancho que el hero — `max-w-7xl` (el hero se queda en `max-w-5xl`, no tocarlo). Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` (hasta 4 columnas). Subtítulos de sección: `text-2xl sm:text-3xl font-bold` — "Herramientas disponibles" en `emerald-600`/`emerald-400`, "Próximamente" en `slate-800`/`slate-100`.
- Catálogo de herramientas centralizado en `src/data/tools.ts` (`availableTools` / `upcomingTools`), reflejando `tools.md`. Al agregar una tool nueva a `tools.md` o pasar una de "próximamente" a disponible, actualizar ese archivo (no hardcodear tools sueltas en páginas).
- **Íconos**: `@tabler/icons-react`, tipo `TablerIcon` (importado de esa lib) para el campo `icon` de `Tool` — evita usar strings/nombres sueltos, siempre el componente importado directamente. Mapeo actual (no agregar íconos sin actualizar esta lista):
  - Imagen a texto → `IconScan`
  - PDF a texto / Imagen a PDF → `IconFileTypePdf`
  - Audio a texto → `IconMicrophone`
  - Extractor de tablas → `IconTable`
  - Facturas y recibos → `IconReceipt2`
  - Manuscrito a texto → `IconWriting`
  - Quitar fondo de imagen → `IconPhotoOff`
  - Comprimir/convertir imagen → `IconFileZip`
  - Traductor de imagen → `IconLanguage`
  - Redimensionar para redes → `IconResize`
  - Paleta de colores → `IconPalette`
  - Marca de agua → `IconRubberStamp`
  - Metadatos EXIF → `IconInfoCircle`
  - Editor de PDF → `IconFiles`
  - Firma digital en PDF → `IconSignature`
  - Texto a voz → `IconVolume`
  - Corrector ortográfico → `IconTextSpellcheck`
  - Resumen de texto → `IconFileDescription`
  - Comparador de textos → `IconGitCompare`
  - Markdown a PDF/Word → `IconMarkdown`
  - Generador/lector QR → `IconQrcode`
  - Contraseñas seguras → `IconKey`
  - Calculadora de fechas → `IconCalendar`

## Páginas de herramientas

- **Ruta**: cada tool disponible tiene su página en `src/pages/<Nombre>.tsx` + su `<Route path="...">` en `App.tsx`, coincidiendo con el `href` de `src/data/tools.ts`.
- **`Ocr.tsx`** (`/ocr`) — página de referencia para futuras tools, mismo patrón a seguir:
  - Layout de 2 columnas **iguales y fluidas** (`grid grid-cols-1 lg:grid-cols-2`, 50/50 automático según el ancho del contenedor — no hay track fijo en px; solo aplica el grid de 2 columnas cuando hay archivos, si no, todo a 1 columna): **columna izquierda** = selector de motor (`fast` = Tesseract / `ai` = Mistral Pixtral, 2 cards clickeables lado a lado, borde `emerald-600` si está seleccionado) + dropzone, apilados. **Columna derecha** = solo la lista de archivos.
  - Dropzone: click, drag & drop y pegar (Ctrl+V), `border-dashed`, acepta `image/jpeg`, `image/png`, `image/webp` (`ACCEPTED_TYPES`/`ACCEPTED_EXT` al tope del archivo — al sumar formato nuevo, actualizar ambas). Cada archivo agregado genera su `previewUrl` (`URL.createObjectURL`) al toque, no recién al convertir — se necesita para el thumbnail de la lista.
  - Lista de archivos (columna derecha): cada item = thumbnail clickeable (abre el mismo modal de preview) + nombre + peso (`formatFileSize`, KB si <1MB, si no MB) + botón quitar (`IconX`, revoca el `previewUrl`). Altura **exacta** (no "stretch" aproximado): ambas columnas usan `lg:h-[26rem]` fijo (columna izquierda y contenedor de la lista), con scroll interno (`overflow-y-auto`) en el `<ul>` una vez que el contenido supera esa altura — a ojo entran ~6 items antes de scrollear (asumiendo columnas ~50/50 en un contenedor `7xl`; con `grid-cols-2` fluido esto varía un poco según el ancho real). En mobile, tope fijo `max-h-80` (no hay columna izquierda con la que igualar).
  - Contenedor de la página (`<section>`, normalmente `max-w-5xl`): pasa a `max-w-7xl` cuando hay archivos cargados (`files.length > 0`) — 2 pasos más ancho en la escala de Tailwind (`5xl → 6xl → 7xl`), para que el layout de 2 columnas tenga más aire. Vuelve a `max-w-5xl` en el estado inicial sin archivos.
  - Botón "Convertir" (`bg-emerald-600`, deshabilitado sin archivos).
  - **Flujo de dos pantallas**: selector de motor + dropzone + lista de archivos + botón Convertir se ocultan por completo una vez que hay `results` (no conviven con la vista de resultados). La vista de resultados muestra primero un botón "Volver a empezar" (`IconRefresh`) que resetea `files`/`results` y revoca los `previewUrl`, y debajo la lista de resultados.
  - Resultado por archivo: fila superior con thumbnail clickeable (`h-14 w-14`, abre modal de vista previa a pantalla completa) + nombre del archivo + **badge de confianza** (solo si `engine === 'fast'`, Mistral no da confidence real) + botones reintentar/copiar/descargar; debajo `textarea` editable con el texto reconocido. Copiar tiene confirmación visual (ícono cambia a `IconCheck` 1.5s).
  - `FileResult` guarda `confidence` y `engine` además de `text`/`previewUrl`/`file` — necesarios para el badge y para saber con qué motor reintentar.
  - **Badge de confianza** (`getConfidenceLevel`, umbrales 80/50): alta `emerald-100/emerald-700`, media `amber-100/amber-700`, baja `red-100/red-700`. Es una excepción puntual a la paleta Emerald+Slate — semáforo de estado (bueno/regular/malo) necesita 3 colores distinguibles, no es un acento de marca. Si se prefiere no usar amber/red aquí tampoco, avisar para ajustarlo.
  - **Reintentar con el otro motor** (`retryResult`, botón `IconSwitchHorizontal` por card, junto a copiar/descargar): reprocesa un único archivo con el motor contrario al que se usó (`fast↔ai`), sin rehacer toda la tanda. Estado `retryingIndex` deshabilita ese botón puntual y muestra spinner mientras corre; si falla, el texto de esa card pasa a `[Error] ...` sin afectar al resto.
  - **Copiar/descargar todo junto**: botones "Copiar todo" / "Descargar todo" junto a "Volver a empezar" (`combineResultsText` concatena `--- nombre.ext ---\n<texto>` por archivo). Descarga como un solo `.txt` (`textos-reconocidos.txt`), no zip — evita sumar una dependencia de compresión por ahora.
  - Modal de preview: sin componente compartido todavía (es la primera vez que se usa) — overlay `fixed inset-0 bg-slate-900/80` (oscuro, para contraste de foto), pero la ventana del modal es **siempre clara** (`bg-white`, sin variante dark — a propósito, un visor de imagen se ve mejor con marco claro sin importar el tema de la app): header solo con `border-b border-emerald-200` (sin relleno, el usuario sacó el `bg-emerald-50` que yo había puesto — más sutil) con el nombre de archivo como título (`text-slate-800`) y botón `X` en `emerald-700`, imagen debajo. Cierra al click afuera, en la `X`, o con **Escape**; bloquea el scroll del body mientras está abierto (`useEffect` + `document.body.style.overflow`); `role="dialog"` `aria-modal="true"` `aria-label` con el nombre del archivo. Si se repite este patrón en otra tool page, extraerlo a un componente común.
  - Todo elemento clickeable lleva `cursor-pointer` explícito (no asumir el default del navegador en `<button>`).
  - **Motor `fast` (Tesseract.js) implementado** en `src/lib/ocr.ts`:
    - `createOcrWorker()` — worker único `spa+eng`, `OEM.LSTM_ONLY`, con `legacyCore: true, legacyLang: true` (necesario para que `worker.detect()` funcione — ver abajo). Se crea una vez por conversión (no por archivo) y se termina (`worker.terminate()`) al final vía `finally`.
    - `recognizeWithTesseract(worker, file)` — **usa OSD (`worker.detect()`)** para detectar orientación (modelo dedicado y liviano) en vez de probar las 4 rotaciones con reconocimiento completo cada una (heurística anterior, ~3-4x más lenta y menos confiable). `normalizeRotation` redondea `orientation_degrees` al múltiplo de 90 más cercano. 1 sola pasada de `recognize()` en la rotación corregida. Si `detect()` falla, sigue sin rotar en vez de cortar la conversión. Antes de reconocer, aplica `enhanceForOcr` (escala de grises + umbral suave).
    - **Downscaling**: `drawScaled` achica a `MAX_DIMENSION = 2000` px de lado mayor antes de procesar (fotos de celular no ganan precisión pasado ese tamaño, solo tiempo). Se aplica en ambos motores.
    - `handleConvert` en `Ocr.tsx` es async: crea el worker, procesa archivos **uno por uno** (secuencial — un solo worker de Tesseract no gana nada corriendo en paralelo), actualiza `progress` (`done/total`) y muestra spinner (`IconLoader2 animate-spin`) + texto "Reconociendo texto (n/total)..." en el botón mientras `isConverting`.
  - **Motor `ai` (Mistral Pixtral) implementado vía backend propio** (decisión del usuario: backend mínimo, no exponer la key en el cliente):
    - `api/ocr-ai.ts` — función serverless formato **Vercel** (`VercelRequest`/`VercelResponse` de `@vercel/node`, devDependency). Recibe `{ image: string }` (data URL base64) por `POST`, arma un chat completion a `https://api.mistral.ai/v1/chat/completions` con `model: 'pixtral-12b-2409'` y un mensaje con `image_url` + prompt de extracción, usando `process.env.MISTRAL_API_KEY` (sin prefijo `VITE_`, nunca se expone al bundle). Devuelve `{ text }`. **El nombre del modelo y la forma exacta del payload de Mistral no se verificaron contra la doc en vivo — revisar si Mistral cambió algo antes de confiar 100% en esto.**
    - `recognizeWithMistral(file)` en `src/lib/ocr.ts` — achica/comprime la imagen (`drawScaled` + `toDataURL('image/jpeg', 0.85)`) antes de mandarla, para que suba más rápido; si falla ese paso cae a `fileToDataUrl` (sin comprimir) como fallback. Sin `confidence` real de Mistral, se hardcodea `100` (el campo existe por compartir el tipo `OcrResult` con Tesseract, no se usa para nada en el motor IA).
    - **Concurrencia**: a diferencia de `fast` (secuencial), el motor `ai` procesa archivos en paralelo con `mapWithConcurrency` (`AI_CONCURRENCY = 3` en `Ocr.tsx`) — son llamadas de red a un backend, no CPU local, así que sí gana con paralelismo. Si `recognizeWithMistral` tira error en algún archivo (ej. sin backend corriendo), ese resultado puntual muestra `[Error] ...` en vez de romper toda la conversión.
    - **Local**: `pnpm dev` (plain Vite) **no sirve `/api/*`** — hace falta `pnpm dev:vercel` (`vercel dev`, requiere `vercel` CLI, `npx vercel dev` si no está instalada globalmente) para probar el motor IA en desarrollo. El motor `fast` (Tesseract) sí funciona con `pnpm dev` normal, no depende de `api/`.
    - `tsconfig.node.json` incluye `api` además de `vite.config.ts` para que `tsc -b` type-checkee la function (antes solo cubría `src`).

# MarianTools

Suite de herramientas (OCR, PDF, imagen, texto, etc.). Ver `tools.md` para catálogo completo.

## Reglas de proceso (migradas de memoria a AGENTS.md 2026-09-23, para que los agentes especializados las hereden automático)

- **UI minimalista**: no agregar texto explicativo extra (párrafos de ayuda bajo controles, descripciones largas) al sumar controles/toggles/opciones nuevas. Solo lo esencial. El usuario pide detalle explícito cuando lo quiere.
- **El usuario prueba él mismo**: si dice "no lo pruebes, yo me aseguro" o similar, parar de inmediato cualquier verificación con browser automation y solo confirmar el cambio hecho en el código.
- **Sin trailer de co-autor en commits**: NO agregar trailers de co-autor del agente (`Co-Authored-By: Claude`, `Claude-Session:` ni equivalentes de otros agentes) en los commits de este repo — excepción explícita a la instrucción global del harness, pedido del usuario, historial ya reescrito para sacarlo.

## Tipografía

Fuente principal: **Comfortaa**, self-hosted (no Google Fonts CDN) desde `src/assets/fonts/comfortaa/*.ttf`, declarada vía `@font-face` en `src/index.css` y seteada como `--font-sans` (Tailwind v4 la propaga a `html`/body vía preflight, sin tocar `App.tsx`). Solo se guardan los 3 pesos que realmente se usan en el código — `Regular`(400) para texto normal, `SemiBold`(600) para `font-semibold`, `Bold`(700) para `font-bold`. `Light` y `Medium` se borraron por no usarse. Si se necesita un peso nuevo, agregar el `.ttf` a esa carpeta + su `@font-face` correspondiente (no reintroducir el import de Google Fonts).

**Sin monospace, en ningún lado** (pedido explícito del usuario, 2026-08-14): ni `font-mono` ni el `<code>` semántico (que Tailwind v4 preflight pone en monospace por default) — Comfortaa es la única familia tipográfica de todo el sitio, incluso para contraseñas y strings base64. Usar `<span>`/`<p>` en vez de `<code>` para mostrar ese tipo de texto, y `break-all` (no `font-mono`) para que quiebre línea. Corregido retroactivamente en `Contrasenas.tsx` e `ImagenABase64.tsx`, que sí usaban `font-mono` — si aparece un caso nuevo, sacarlo también.

## Estilo/diseño

`App.tsx` sin `className` por pedido explícito del usuario — HTML plano, sin Tailwind. No agregar clases ahí salvo que el usuario lo pida de nuevo. `Header.tsx` y `Footer.tsx` salen de esta regla (pedidos explícitos posteriores de estilarlos).

Escala tipográfica (congelada, normalizada — solo pasos estándar de Tailwind, nada arbitrario tipo `text-[Npx]`): `text-xs`(12) `text-sm`(14) `text-base`(16) `text-lg`(18) `text-xl`(20) `text-2xl`(24) `text-3xl`(30) `text-4xl`(36) `text-5xl`(48). Uso: hero H1 `4xl→5xl`, subtítulo de sección `2xl→3xl`, marca de Header / título de card `lg`, párrafo de hero `lg`, descripción de card `base`, nav/footer/CTA `sm`, cinta "Pronto" `xs`.

Paleta (congelada, elegida por el usuario entre 4 opciones — "Emerald + Slate"):

- Escala neutra: `slate`. Texto muted `-500` / primario `-800`, regla global. En dark: `slate-400` (muted) / `slate-100` (primario). Excepción: copy principal del hero usa `-800`/`-100` en vez de `-500`/`-400` — con muted quedaba casi invisible sobre el fondo de la card.
- Acento: `emerald-600` (dark: `emerald-400`) — único color de marca/CTA/links/hover. No mezclar con blue ni otro acento.
- Botón primario (CTA): `bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg`.
- Header: **sticky** (`sticky top-0 z-50`), `border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900`, contenedor `mx-auto max-w-5xl flex items-center px-6 py-4`, marca `slate-800`/`slate-100` (no acento). **Sin nav link ni ruta `/tools`** (eliminados 2026-08-17 a pedido explícito del usuario — la página `Herramientas.tsx` era un stub sin construir; el catálogo completo ya vive en `Inicio.tsx`, con las secciones "Herramientas disponibles"/"Próximamente"). El botón "Ver herramientas" del hero de `Inicio.tsx` primero pasó a ser un `<a href="#herramientas-disponibles">` (scroll a la sección de la misma página) y después se **eliminó del todo** (mismo día, pedido explícito del usuario) — el hero quedó solo con H1 + párrafo, sin CTA.
- Footer: mismo contenedor/borde que Header (`border-t` en vez de `border-b`), texto centrado `slate-500`/`slate-400`.
- Fondo de páginas: `<main>` en `MainLayout.tsx` lleva `bg-slate-100 dark:bg-slate-950` (fondo ligero, distinto del blanco de Header/Footer). Header y Footer se mantienen `bg-white`/`dark:bg-slate-900` para marcar el límite del layout.
- Card/hero: **glassmorphism** (elegido por el usuario entre glassmorphism vs. blur decorativo) — `bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-slate-700/40`, con gradiente decorativo detrás (`bg-linear-to-br from-emerald-200/40 via-transparent to-slate-200/40` (Tailwind v4 renombró `bg-gradient-to-*` → `bg-linear-to-*`, usar siempre la sintaxis nueva), posicionado `absolute inset-0 -z-10` dentro de un contenedor `relative overflow-hidden`). Este patrón de gradiente+glass es el que se repite en cualquier card destacada futura.
- Contenedor de página: `mx-auto max-w-5xl px-6 py-16` para el hero de `Inicio.tsx` (no tocar). Para tool pages nuevas, el ancho de reposo por defecto es `max-w-7xl` — ver `## Ancho de contenedor de tool pages` más abajo.
- Dark mode vía `prefers-color-scheme` (sin toggle manual).
- **ToolCard** (`src/components/ToolCard.tsx`): componente único para tarjetas de herramienta, reusar siempre en vez de reimplementar (ej. en `Herramientas.tsx`). Props vienen de `Tool` en `src/data/tools.ts` (`title`, `description`, `href?`, `category?`) + `comingSoon?`. Si tiene `href` y no es `comingSoon`, la card entera es `Link`. Card cuadrada (`aspect-square`), contenido centrado verticalmente: ícono → nombre → descripción (`line-clamp-2`). `category` no se muestra en la card (queda en el dato para uso futuro, ej. filtros). Badge "Próximamente" es una **cinta diagonal (ribbon)** en la esquina superior derecha (elegida entre 5 opciones: franja inferior sólida, gradiente, ghost/outline, ribbon, punto+texto): `absolute -right-9 top-4 w-32 rotate-45 bg-slate-800 dark:bg-slate-700 text-white text-xs uppercase`, texto "Pronto", recortada por el `overflow-hidden` de la card. Color `slate` (no `amber`) para no salirse de la paleta congelada Emerald + Slate. No usa `opacity-60` en la card. Ícono `size={44} stroke={1.5}`. Nombre `text-lg font-semibold`, descripción `text-base`. Descripciones de `Tool` son frases cortas (2-5 palabras, ej. "Con OCR e IA para conversiones"), no oraciones completas — ver `src/data/tools.ts`.
- Secciones de cards (`Herramientas disponibles` / `Próximamente`): contenedor más ancho que el hero — `max-w-7xl` (el hero se queda en `max-w-5xl`, no tocarlo). Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` (hasta 4 columnas). Subtítulos de sección: `text-2xl sm:text-3xl font-bold` — "Herramientas disponibles" en `emerald-600`/`emerald-400`, "Próximamente" en `slate-800`/`slate-100`.
- `category` es obligatoria y sale de un set cerrado en `tools.ts` (`categories`: Extracción, Imagen, PDF, Texto, Utilidades). `Inicio.tsx` filtra "Herramientas disponibles" con un buscador (sin tildes) y chips por categoría (patrón de chip: activo `bg-emerald-600 text-white`, inactivo borde `slate`). El orden de `availableTools` es por prioridad, no cronológico.
- Catálogo de herramientas centralizado en `src/data/tools.ts` (`availableTools` / `upcomingTools`), reflejando `tools.md`. Al agregar una tool nueva a `tools.md` o pasar una de "próximamente" a disponible, actualizar ese archivo (no hardcodear tools sueltas en páginas).
- **Íconos**: `@tabler/icons-react`, tipo `TablerIcon` (importado de esa lib) para el campo `icon` de `Tool` — evita usar strings/nombres sueltos, siempre el componente importado directamente. Mapeo actual (no agregar íconos sin actualizar esta lista):
  - Imagen a texto → `IconScan`
  - Imagen a Base64 → `IconBinary`
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
  - Comprimir PDF → `IconFileZip`; PDF a JPG → `IconPhotoDown`; PDF a Word → `IconFileTypeDocx`; Rotar PDF → `IconRotateClockwise2`; Numerar páginas → `IconListNumbers`; Recortar PDF → `IconCrop`
  - Calculadora de CTS → `IconCalculator`; gratificación → `IconGift`; liquidación → `IconReportMoney`; horas extras → `IconClockHour4`; IGV → `IconReceiptTax`; Validador de RUC → `IconId`

## Motion / accesibilidad (congelado, introducido 2026-07-16 vía skill `frontend-design`)

- **Keyframes compartidos** en `src/index.css` (fuera de `@theme`, Tailwind v4 no genera `@keyframes` custom desde utilidades arbitrarias): `reveal-up` (fade + translateY 10px, entrada de elementos), `scan-sweep` (barrido vertical `top` 4%→88%, usado en el visual de firma del hero), `fade-in` (backdrop de modal) y `modal-pop` (fade + scale 0.96→1 + translateY, panel de modal). Si se necesita una animación nueva reusable, agregar el `@keyframes` ahí, no inline por componente.
- **Entrada escalonada de grids/listas** (tool cards, resultados de OCR): cada item envuelto en un wrapper con `motion-safe:opacity-0 motion-safe:animate-[reveal-up_0.5s_ease-out_forwards]` + `style={{ animationDelay: '${Math.min(i * 60, 300)}ms' }}` (el `Math.min` evita colas largas en grids con muchos items, ver `upcomingTools` con delay `i * 40` tope `320ms`). **Siempre con prefijo `motion-safe:`** en la clase de opacity Y en la de animate — nunca `opacity-0` a secas, porque si el usuario tiene `prefers-reduced-motion: reduce` la animación no corre y el elemento queda invisible para siempre. Este patrón es el estándar para cualquier grid/lista nueva que aparezca al montar la página.
- **Modal/preview overlay**: backdrop con `motion-safe:animate-[fade-in_0.15s_ease-out]`, panel con `motion-safe:animate-[modal-pop_0.18s_ease-out]`. Aplicar a cualquier modal nuevo que se abra sobre la página (no solo el preview de imagen de OCR).
- **Signature visual del hero (Inicio)**: mini card con línea `scan-sweep` (emerald, `motion-safe:animate-[scan-sweep_2.6s_ease-in-out_infinite]`) sobre barras `slate-300/70` simulando líneas de texto, una barra en `emerald-400/80` representando la línea "reconocida" — motivo ligado al producto (OCR), no decorativo genérico. Es específico del hero de Inicio, no reusar tal cual en otras páginas sin pedirlo; el criterio de motion (`motion-safe:`, timing, keyframes compartidos) sí es el estándar a seguir.
- **Foco visible**: todo elemento interactivo (botón, link, input, textarea) lleva anillo de foco en el acento de marca — `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900` (ajustar el color de `ring-offset` al fondo real del elemento si no es `slate-900`/blanco). En páginas con muchos controles repetidos (ej. `Ocr.tsx`) se define una constante `FOCUS_RING` al tope del archivo y se concatena a cada `className`, en vez de repetir la cadena literal. Reemplaza el outline azul default del navegador — no dejar ningún elemento clickeable sin este anillo.
- **Dropzone con estado de drag-over**: al arrastrar un archivo sobre la zona, cambia a `border-emerald-600 bg-emerald-50/60 dark:bg-emerald-500/10` + ícono en acento + copy cambia a "Suelta las imágenes aquí" (en vez del texto de instrucción). Implementado con contador de `dragCounter` (`useRef`) en `onDragEnter`/`onDragLeave` para evitar parpadeo cuando el cursor pasa sobre elementos hijos del dropzone. Patrón a reusar en cualquier dropzone futura.

## Páginas de herramientas

- **Ruta**: cada tool disponible tiene su página en `src/pages/<Nombre>.tsx` + su `<Route path="...">` en `App.tsx`, coincidiendo con el `href` de `src/data/tools.ts`.

Una página por herramienta (leer solo la que toque tu tarea):

- **`Ocr.tsx`** (`/ocr`) — página de referencia: leerla antes de crear o rehacer cualquier tool → [docs/herramientas/ocr-tsx.md](docs/herramientas/ocr-tsx.md)
- **`ImagenABase64.tsx`** (`/base64`) → [docs/herramientas/imagenabase64-tsx.md](docs/herramientas/imagenabase64-tsx.md)
- **`Contrasenas.tsx`** (`/contrasenas`) → [docs/herramientas/contrasenas-tsx.md](docs/herramientas/contrasenas-tsx.md)
- **`Qr.tsx`** (`/qr`) → [docs/herramientas/qr-tsx.md](docs/herramientas/qr-tsx.md)

## Sección "Otras herramientas" en cada tool page (congelado, 2026-08-14)

**`src/components/OtherTools.tsx`** — componente compartido, pedido explícito del usuario: toda página de herramienta debe mostrar, al final, una grilla con las demás herramientas disponibles (mismo patrón visual que la sección "Herramientas disponibles" de `Inicio.tsx`: heading `text-2xl font-bold text-emerald-600 sm:text-3xl dark:text-emerald-400` + grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` con `ToolCard` y reveal-up escalonado). Recibe `currentHref` y filtra `availableTools` para no mostrarse a sí misma.

**Colocación**: un solo `<OtherTools currentHref="/xxx" />` como sibling *después* de la `<section>` principal de la página (no adentro), envolviendo el `return` en un fragment `<>...</>`. Con esto alcanza una sola inserción por página para cumplir el pedido de "que aparezca tanto en el estado inicial como debajo de los resultados" — como el bloque de resultados y el de formulario/dropzone son ramas condicionales mutuamente excluyentes dentro de la misma `<section>`, `OtherTools` queda siempre como lo último de la página sin importar cuál rama esté activa, sin necesidad de duplicarlo en cada rama. Ancho propio `max-w-7xl` independiente del ancho (a veces dinámico) de la section de la tool. Ya insertado en `Ocr.tsx`, `ImagenABase64.tsx`, `Contrasenas.tsx`, `Qr.tsx`, y en las 3 tools nuevas de abajo — **toda página de tool nueva debe agregarlo también**, es parte del molde estándar junto con `FOCUS_RING`/dropzone/etc.

## Ancho de contenedor de tool pages (congelado, 2026-08-17)

**Regla**: el ancho "en reposo" (sin archivos/resultados cargados) de toda tool page debe ser `max-w-7xl`, igual que `OtherTools.tsx` — así el `<h1>`/subtítulo de la tool queda alineado con el borde izquierdo de la grilla "Otras herramientas" que aparece al final de la página. Antes varias tools (`Ocr`, `ImagenABase64`, `Facturas`, `Comparador`, `Paleta`) usaban `max-w-5xl` en reposo mientras `OtherTools` es fijo `max-w-7xl` — como ambos contenedores se centran de forma independiente (`mx-auto`) pero con anchos distintos, sus bordes izquierdos NO coinciden (a más ancho, el contenedor arranca más a la izquierda): con `max-w-5xl` (1024px) vs `max-w-7xl` (1280px) el título quedaba **128px más a la derecha** que la grilla de abajo. Bug real reportado por el usuario comparando screenshots de `/contrasenas` (que por casualidad numérica caía casi alineado) contra `/ocr` (claramente desalineado).

**Estado con archivos/resultados cargados**: las tools que ensanchan el contenedor al cargar archivos (`Ocr`, `ImagenABase64`, `Facturas` — ver `files.length > 0` / `isWide`) suben a `max-w-[90rem]` (1440px) en vez de al viejo `max-w-4/5` (fracción relativa al viewport, no a un valor fijo — en pantallas medianas terminaba siendo MÁS angosto que el `max-w-7xl` de reposo, o sea el contenedor se encogía al cargar archivos en vez de agrandarse, otro bug que se corrigió de paso).

**Excepciones que se mantienen así a propósito**:
- `Contrasenas.tsx` sigue en `max-w-[100rem]` (más ancho, ver `## Estilo/diseño` más arriba) — necesita más aire por el grid de 2 columnas con cards de ancho fijo en px. Su título queda razonablemente cerca del borde de `OtherTools` por la combinación `max-w-[100rem]` + wrapper interno `w-fit`, pero no es una garantía matemática como en las demás — si se vuelve a tocar el ancho de esta página, revalidar contra `OtherTools`.
- `Qr.tsx` ya estaba en `max-w-7xl` desde que se creó, no necesitó cambio.
- La sección del **hero** de `Inicio.tsx` se queda en `max-w-5xl` a propósito (documentado arriba, "el hero se queda en `max-w-5xl`, no tocarlo") — no es una tool page, no aplica esta regla.

Si se crea una tool page nueva, el ancho de reposo por defecto debe ser `max-w-7xl` (no `max-w-5xl` como en versiones viejas de este documento) para que el título salga alineado con `OtherTools` sin tener que pensarlo.

## SEO (2026-10-16)

Dominio `https://www.mariantools.com`. Meta por ruta en `src/data/seo.ts` (título, descripción; datos puros). `RouteSeo` (en `MainLayout`) actualiza el head al navegar; `scripts/prerender.mjs` (corre en `pnpm build`) genera `dist/<ruta>/index.html` con meta, canonical, Open Graph y JSON-LD, más `sitemap.xml`. **Toda tool nueva debe sumar su entrada en `seo.ts`** (además de `tools.ts` y la ruta en `App.tsx`), si no queda sin meta ni sitemap. `robots.txt` en `public/`. Rutas desconocidas caen en `NoEncontrada` con `noindex`.

## Stack
- Vite + React 19 + TypeScript
- Tailwind CSS v4 (import directo, sin `tailwind.config`)
- react-router-dom v7
- @tabler/icons-react — íconos, ver lista curada abajo
- `vercel.json` — rewrite catch-all (`/(.*) → /index.html`) para que rutas hijas de React Router (ej. `/ocr`) no den 404 al refrescar en Vercel. No afecta `/api/*`: Vercel prioriza funciones/archivos reales sobre los rewrites.

## Copy / idioma
Español neutro tipo Perú (PE) — **nunca voseo argentino**. "transcribe" no "transcribí", "genera" no "generá", "crea"/"lee" no "creá"/"leé", etc. Usar conjugación de tercera persona/imperativo neutro, no vos. Aplica a todo texto de UI (`tools.ts`, páginas, componentes). `tools.md` es documento de planificación del usuario, no se toca.

## Convenciones al crear o tocar una tool
- Seguir el patrón de `Ocr.tsx` (`docs/herramientas/ocr-tsx.md`) para layout, dropzone y resultados.
- Al instalar un paquete nuevo, `pnpm-workspace.yaml` tiene un bloque `allowBuilds`: hay que aprobar explícitamente su script de instalación o `pnpm install`/`build` fallan.
- Bugs que ya se repitieron al hacer tools (tipos de `Blob` con `pdf-lib`, lint `react-hooks/set-state-in-effect` en efectos async): ver `docs/herramientas/tools-sin-ia-segunda-tanda.md` antes de volver a resolverlos.

## Documentos por tema (leer solo el archivo que toque tu tarea)

- [Tools nuevas — Comparador, Paleta, Facturas (2026-08-14)](docs/herramientas/tools-nuevas-comparador-paleta-facturas.md)
- [Tools sin IA — segunda tanda (2026-08-17)](docs/herramientas/tools-sin-ia-segunda-tanda.md)
- [Tools con IA — tanda 1 (2026-10-16)](docs/herramientas/tools-ia-tanda-1.md)
- [Tanda 2 — PDF a texto, Audio a texto, Quitar fondo (2026-10-16)](docs/herramientas/tools-ia-tanda-2.md)
- [Tanda 3 — herramientas PDF y calculadoras de Perú (2026-10-16)](docs/herramientas/tools-pdf-y-calculadoras-peru.md)
- [Créditos y medición de IA (2026-10-16)](docs/decisiones-creditos.md) — toda tool con IA nueva pasa por `reserve`/`refund` de `api/_billing.ts`

# MarianTools

**MarianTools** es una suite de 46 herramientas web gratis para trabajar con archivos: OCR, PDF, imágenes, texto y calculadoras laborales de Perú. Software libre bajo [MIT](LICENSE).

> 🚀 **En 3 comandos:** `git clone https://github.com/pipodev06/mariantools.git && cd mariantools` → `pnpm install` → `pnpm dev` y abre http://localhost:5173 (detalle en [Cómo levantarlo](#-cómo-levantarlo)).

```
Archivo ─▶ se procesa en tu navegador (no sale del equipo) ─▶ resultado para copiar o descargar
        └▶ herramientas con IA ─▶ api/ en el servidor ─▶ proveedor de IA ─▶ resultado
```

## ✨ Qué hace

- 🧾 **Extracción:** facturas y recibos a CSV (fecha, monto, RUC, proveedor); imagen, PDF, audio y manuscrito a texto; extractor de tablas.
- 📄 **PDF:** escanear con la cámara, unir, dividir, reordenar, firmar, comprimir, rotar, numerar, recortar, y convertir a JPG o Word.
- 🖼️ **Imagen:** quitar fondo, traducir, comprimir a un peso exacto, redimensionar, recortar, HEIC a JPG, marca de agua, EXIF y paleta de colores.
- 🇵🇪 **Calculadoras de Perú:** sueldo neto, renta de quinta, CTS, gratificación, liquidación, horas extras, IGV y días hábiles (referenciales, régimen general).

<details>
<summary>➕ <b>Todas las funciones</b></summary>

- ✍️ **Texto:** resumen, corrector ortográfico, comparador, contador de palabras, texto a voz y Markdown a PDF/Word.
- 🧰 **Utilidades:** número a letras, códigos de barras, QR, validador de RUC y contraseñas seguras.
- 🔒 **Privado por defecto:** la mayoría de herramientas corre en el navegador y el archivo no sale del equipo.
- 🤖 **IA con usos gratis cada día;** después usan créditos.

</details>

## 🧱 Tecnologías

| Pieza | Tecnología |
|---|---|
| 🖥️ Interfaz | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| 🧩 Procesamiento local | Tesseract.js, pdf.js, pdf-lib, Transformers.js |
| ⚙️ Backend | Funciones serverless de Vercel (`api/`) con cualquier API de IA compatible con OpenAI, con rotación y respaldo entre proveedores |
| 🗄️ Base de datos | Supabase (cuentas, créditos y comentarios) |
| ☁️ Hosting | Vercel |

## 📋 Requisitos

| Necesitas | Detalle |
|---|---|
| 🟢 Node | 20 o más |
| 📦 pnpm | Gestor de paquetes del proyecto |
| 🔑 Proveedor de IA y Supabase | Opcionales: solo para las herramientas con IA y los créditos |

## 🚀 Cómo levantarlo

```bash
git clone https://github.com/pipodev06/mariantools.git && cd mariantools
cp .env.example .env.local        # opcional: las herramientas locales funcionan sin variables
pnpm install
pnpm dev                          # http://localhost:5173 (también sirve /api/*)
```

1. Abre **http://localhost:5173** y elige una herramienta. ✅

Otros comandos: `pnpm build` (type-check, build y prerender de cada ruta con `sitemap.xml`), `pnpm lint`, `pnpm test` y `pnpm preview`.

## ⚙️ Configuración

Las variables van en `.env.local` y solo hacen falta para las herramientas con IA y los créditos.

| Variable | Para qué | Ejemplo de formato |
|---|---|---|
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Proveedor de IA para texto e imágenes | `AI_BASE_URL=https://api.groq.com/openai/v1` |
| `AI_1_*` … `AI_6_*` | Varios proveedores con rotación: si uno falla o tarda, se usa el siguiente | mismos tres campos por proveedor |
| `AI_AUDIO_API_KEY`, `AI_AUDIO_BASE_URL`, `AI_AUDIO_MODEL` | Audio a texto (si faltan clave y URL, usa las de `AI_*`) | API compatible con `/audio/transcriptions` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Créditos y cupo gratis | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Login en el navegador (la anon key es pública) | `https://<ref>.supabase.co` |
| `FREE_DAILY_USES`, `BILLING_SALT` | Usos gratis de IA por día y sal para hashear IPs | número · texto aleatorio largo |

**⚠️ Ojo con esto:**

| Si haces esto | Qué pasa |
|---|---|
| Poner la `service_role` con prefijo `VITE_` | Queda pública en el navegador: va solo en `SUPABASE_SERVICE_ROLE_KEY`, que leen las funciones de `api/` |
| Dejar sin variables de IA | Las herramientas con IA no responden; las locales siguen funcionando |
| Dudar de si un proveedor anda | `node --env-file=.env.local scripts/check-ai.mjs` lo prueba sin imprimir claves |

## 🌐 Despliegue

En Vercel: importa el repo y carga las mismas variables en *Project Settings → Environment Variables*. Las migraciones de Supabase están en `supabase/migrations/`.

Sitio: https://mariantools.vercel.app

## 📜 Licencia

[MIT](LICENSE).

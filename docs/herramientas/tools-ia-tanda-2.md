# Tanda 2 — PDF a texto, Audio a texto, Quitar fondo (2026-10-16)

- **Componentes compartidos**: `components/FileDropzone.tsx` (dropzone de 1 archivo) y `components/SingleFileTextTool.tsx` (un archivo entra, un texto sale; copiar y descargar `.txt`). Los usan PDF a texto y Audio a texto.
- **PDF a texto** (`/pdf-a-texto`, `lib/pdfText.ts`): `pdfjs-dist` lee la capa de texto; las páginas con menos de 20 caracteres se renderizan a canvas (escala 2) y pasan por Tesseract (`recognizeCanvasWithTesseract` en `lib/ocr.ts`). Todo en el navegador.
- **Audio a texto** (`/audio-a-texto`, `lib/audio.ts` + `api/transcribe.ts`): el cliente decodifica, pasa a mono 16 kHz y corta en trozos WAV de 100 s (~3.2 MB, bajo el límite de 4.5 MB de Vercel). Cada trozo va como cuerpo crudo `audio/wav` a `/api/transcribe` → Mistral `voxtral-mini-latest` (`/v1/audio/transcriptions`). Tope de 20 MB por archivo (decodificar audio largo consume mucha RAM). Los cortes caen cada 100 s sin buscar silencios.
- **Quitar fondo** (`/quitar-fondo`, `lib/removeBackground.ts`): MODNet (`Xenova/modnet`, Apache-2.0) con `@huggingface/transformers`, import dinámico. Decisión del usuario: se evitó `@imgly/background-removal` por ser AGPL. MODNet es de retratos: con objetos recorta peor. Descarga ~25 MB de modelo la primera vez (Hugging Face) y los WASM de onnxruntime desde CDN.
- `pnpm-workspace.yaml`: `onnxruntime-node` y `protobufjs` en `false` (el navegador usa onnxruntime-web).
- `upcomingTools` quedó vacío; `Inicio.tsx` oculta la sección "Próximamente" cuando no hay tools.

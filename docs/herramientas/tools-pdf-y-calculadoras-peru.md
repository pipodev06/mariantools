# Tanda 3 — PDF y calculadoras de Perú (2026-10-16)

## PDF (todo en el navegador)
- `components/PdfTransformTool.tsx`: un PDF entra, se aplica una operación (`run(file, onProgress)`) y se descarga el resultado. `controls?` recibe los campos de opciones. Lo usan Rotar, Numerar páginas, Recortar, Comprimir, PDF a JPG y PDF a Word (una página de ~20 líneas cada una).
- `lib/pdfTools.ts`: `pdf-lib` para rotar/numerar/recortar (recortar fija MediaBox y CropBox); `pdfjs-dist` (vía `lib/pdfjs.ts`, que configura el worker en un solo lugar) para renderizar páginas.
- **Comprimir PDF**: convierte cada página a JPEG y rebuilda el PDF (pierde el texto seleccionable; el subtítulo lo avisa). Niveles en `COMPRESSION_LEVELS`. Si el resultado pesa más que el original, la UI igual muestra ambos tamaños.
- **PDF a JPG**: JPEG a escala 2, calidad 0.9, empaquetados en ZIP con `fflate` (nivel 0).
- **PDF a Word**: texto vía `extractPdfText` (OCR en páginas escaneadas) → `docx`. No conserva el diseño.
- Los PDF con contraseña fallan con un mensaje claro: no se soporta descifrar.

## Calculadoras de Perú (`lib/laboral.ts`, sin dependencias de React)
- Régimen laboral general. **Todas son referenciales** y cada página lo avisa en una línea.
- CTS: RC/12 por mes + RC/360 por día; RC = remuneración + 1/6 de la última gratificación (se asume igual a una remuneración computable).
- Gratificación: remuneración × meses/6 + bonificación extraordinaria 9% (EsSalud) o 6.75% (EPS) — constantes `BONIF_*`.
- Liquidación: CTS trunca desde el 1 de mayo o 1 de noviembre, vacaciones desde el último aniversario, gratificación por meses completos del semestre. Asume vacaciones no gozadas; no incluye indemnización ni descuentos.
- Horas extras: 25% (2 primeras del día) y 35% (resto); valor hora = sueldo/30/jornada.
- IGV: tasa editable (default 18).
- Validador de RUC: 11 dígitos, prefijo 10/15/16/17/20 y dígito verificador módulo 11. No consulta SUNAT.
- Verificado con casos a mano en Node (CTS semestral 3000 → 1750; gratificación 3000 → 3270; RUC 20131312955 y 20100070970 válidos). **No se incluyó renta de 5ta**: depende del valor de la UIT del año y no se pudo confirmar. Un contador debería revisar las fórmulas antes de promocionarlas.
- Mismo patrón de UI: `ToolShell` + `FormFields` (`NumberField`, `DateField`, `SelectField`, `TextField`, `ResultCard`).
- Categoría nueva `Calculadoras` en `tools.ts` (incluye la Calculadora de fechas).

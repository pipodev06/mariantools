// Datos puros (sin imports de React): los usan el runtime (`RouteSeo`) y el script de
// prerender (`scripts/prerender.mjs`, que corre en Node). Al agregar una tool nueva a
// `src/data/tools.ts`, agregar también su entrada aquí o no saldrá en el sitemap ni tendrá meta tags.

export const SITE_URL = 'https://www.mariantools.com'
export const SITE_NAME = 'MarianTools'

export type SeoEntry = {
  /** Título de la página sin la marca; se le agrega `| MarianTools`. */
  title: string
  description: string
}

export const HOME_SEO = {
  title: 'Herramientas online gratis: OCR, PDF e imagen',
  description:
    'Convierte imagen a texto con OCR, edita PDF, comprime imágenes, extrae datos de facturas y más. Herramientas online gratis, rápidas y sin instalar nada.',
}

export const toolSeo: Record<string, SeoEntry> = {
  '/ocr': {
    title: 'Imagen a texto (OCR) gratis online',
    description:
      'Extrae texto de imágenes y fotos con OCR gratis o con IA. Sube varias imágenes JPG, PNG o WebP a la vez y copia o descarga el resultado.',
  },
  '/base64': {
    title: 'Imagen a Base64 online: convertir a Data URL',
    description:
      'Convierte imágenes JPG, PNG, WebP, GIF o SVG a Base64 o Data URL, o decodifica Base64 a imagen. Se procesa en tu navegador, sin subir nada.',
  },
  '/contrasenas': {
    title: 'Generador de contraseñas seguras',
    description:
      'Genera contraseñas seguras y aleatorias online: elige la longitud, mayúsculas, números y símbolos. Se crean en tu navegador.',
  },
  '/qr': {
    title: 'Generador y lector de códigos QR gratis',
    description:
      'Crea códigos QR de texto, enlaces o WiFi con tus colores y descárgalos en PNG, o lee un QR desde una imagen. Gratis, sin registro.',
  },
  '/comparador': {
    title: 'Comparador de textos online: ver diferencias',
    description:
      'Compara dos textos o dos versiones de un documento y resalta las diferencias por palabra o por línea. Gratis y sin registro.',
  },
  '/paleta': {
    title: 'Paleta de colores desde una imagen',
    description:
      'Extrae los colores dominantes de cualquier foto o imagen y copia sus códigos HEX para tus diseños. Gratis y en tu navegador.',
  },
  '/facturas': {
    title: 'Extraer datos de facturas y recibos con IA',
    description:
      'Obtén fecha, monto, moneda, RUC, proveedor y número de comprobante de tus facturas y recibos con IA. Exporta los resultados a CSV.',
  },
  '/comprimir': {
    title: 'Comprimir y convertir imágenes online',
    description:
      'Reduce el peso de tus imágenes o llévalas a un peso exacto en KB, y conviértelas a JPG, PNG o WebP con poca pérdida de calidad, directo en tu navegador.',
  },
  '/imagen-a-pdf': {
    title: 'Imagen a PDF: une varias imágenes en un PDF',
    description:
      'Convierte una o varias imágenes en un solo archivo PDF. Ordena las páginas y descarga el resultado gratis.',
  },
  '/redimensionar': {
    title: 'Redimensionar imágenes para redes sociales',
    description:
      'Cambia el tamaño de tus fotos al formato exacto de Instagram, Facebook, LinkedIn, X o YouTube con presets listos. Gratis y en tu navegador.',
  },
  '/marca-de-agua': {
    title: 'Agregar marca de agua a imágenes y PDF',
    description:
      'Protege tus imágenes y documentos PDF con una marca de agua de texto o imagen. Gratis y en tu navegador.',
  },
  '/exif': {
    title: 'Ver metadatos EXIF de una foto',
    description:
      'Consulta la cámara, la fecha de captura, la exposición y la ubicación GPS que guardan tus fotos en sus metadatos EXIF. Gratis y en tu navegador.',
  },
  '/editor-pdf': {
    title: 'Unir, dividir y reordenar PDF online',
    description:
      'Une varios PDF en uno, divide un PDF en partes o reordena sus páginas. Gratis, sin registro y sin instalar programas.',
  },
  '/firma-pdf': {
    title: 'Firmar PDF online con tu firma',
    description:
      'Dibuja tu firma con el mouse o el dedo y colócala en cualquier página de un PDF. Gratis, sin registro y en tu navegador.',
  },
  '/texto-a-voz': {
    title: 'Texto a voz online gratis',
    description:
      'Convierte cualquier texto en audio narrado al instante con las voces de tu navegador. Elige la voz y ajusta la velocidad, gratis.',
  },
  '/markdown': {
    title: 'Markdown a PDF y Word',
    description:
      'Convierte texto en Markdown a un PDF o a un documento Word (.docx) con formato, listo para entregar. Gratis y en tu navegador.',
  },
  '/calculadora-fechas': {
    title: 'Calculadora de fechas y días hábiles',
    description:
      'Calcula cuántos días hay entre dos fechas, suma o resta días a una fecha y cuenta solo los días hábiles. Gratis y al instante.',
  },
  '/manuscrito': {
    title: 'Manuscrito a texto: letra a mano con IA',
    description:
      'Convierte letra a mano de una foto en texto editable con IA, y copia o descarga la transcripción. Con usos gratis cada día.',
  },
  '/extractor-tablas': {
    title: 'Extraer tablas de imágenes a CSV para Excel',
    description:
      'Convierte una tabla de una imagen en un archivo CSV que se abre en Excel, usando IA. Con usos gratis cada día.',
  },
  '/traductor-imagen': {
    title: 'Traductor de imágenes con IA',
    description:
      'Lee el texto de una imagen y tradúcelo a español, inglés, portugués, francés, alemán o italiano con IA. Con usos gratis cada día.',
  },
  '/corrector': {
    title: 'Corrector ortográfico y gramatical online',
    description:
      'Corrige la ortografía, la gramática y la puntuación de tus textos con IA y copia el resultado. Con usos gratis cada día.',
  },
  '/resumen': {
    title: 'Resumen de texto con IA',
    description:
      'Resume documentos y textos largos con IA en pocas oraciones, en un párrafo o en varios, según el largo que elijas. Con usos gratis cada día.',
  },
  '/pdf-a-texto': {
    title: 'PDF a texto, incluso si está escaneado',
    description:
      'Extrae el texto de un PDF y cópialo o descárgalo. Si el PDF está escaneado, lo lee con OCR directamente en tu navegador.',
  },
  '/audio-a-texto': {
    title: 'Audio a texto: transcribe notas de voz',
    description:
      'Transcribe notas de voz y grabaciones de audio a texto con IA. Admite MP3, WAV, M4A y OGG. Con usos gratis cada día.',
  },
  '/comprimir-pdf': {
    title: 'Comprimir PDF online',
    description:
      'Reduce el peso de tu PDF para enviarlo por correo o subirlo a un portal. Elige el nivel de compresión y descarga el resultado.',
  },
  '/pdf-a-jpg': {
    title: 'PDF a JPG: convierte cada página en imagen',
    description:
      'Convierte las páginas de un PDF en imágenes JPG y descárgalas juntas en un ZIP. Gratis y en tu navegador.',
  },
  '/pdf-a-word': {
    title: 'PDF a Word: texto editable',
    description:
      'Pasa el texto de un PDF a un documento Word (.docx) que puedes editar. Si está escaneado, lo lee con OCR.',
  },
  '/rotar-pdf': {
    title: 'Rotar PDF online',
    description:
      'Gira todas las páginas de un PDF 90°, 180° o 270° y descarga el archivo corregido. Gratis y sin registro.',
  },
  '/numerar-paginas-pdf': {
    title: 'Numerar páginas de un PDF',
    description:
      'Agrega el número de página al pie de cada hoja de tu PDF. Elige la posición, el formato y el número inicial.',
  },
  '/recortar-pdf': {
    title: 'Recortar PDF: quitar márgenes',
    description:
      'Recorta los márgenes de todas las páginas de un PDF indicando los milímetros a quitar por cada lado.',
  },
  '/calculadora-cts': {
    title: 'Calculadora de CTS en Perú',
    description:
      'Calcula tu Compensación por Tiempo de Servicios del semestre con tu sueldo, asignación familiar y gratificación. Cálculo referencial.',
  },
  '/calculadora-gratificacion': {
    title: 'Calculadora de gratificación en Perú',
    description:
      'Calcula tu gratificación de julio o diciembre y su bonificación extraordinaria de EsSalud o EPS. Cálculo referencial.',
  },
  '/calculadora-liquidacion': {
    title: 'Calculadora de liquidación laboral en Perú',
    description:
      'Estima tus beneficios sociales al cese: CTS trunca, vacaciones truncas y gratificación trunca. Cálculo referencial.',
  },
  '/calculadora-horas-extras': {
    title: 'Calculadora de horas extras en Perú',
    description:
      'Calcula el pago de tus horas extras: 25% las dos primeras horas del día y 35% desde la tercera. Cálculo referencial.',
  },
  '/calculadora-igv': {
    title: 'Calculadora de IGV 18% (agregar y quitar)',
    description:
      'Agrega o quita el IGV de un monto y obtén el valor sin IGV, el impuesto y el total al instante. Tasa editable, por defecto 18%.',
  },
  '/validador-ruc': {
    title: 'Validador de RUC peruano',
    description:
      'Comprueba si un RUC tiene 11 dígitos, un prefijo válido y el dígito verificador correcto. No consulta SUNAT.',
  },
  '/recortar-imagen': {
    title: 'Recortar imagen online',
    description:
      'Recorta tu imagen en rectángulo, en proporción 1:1, 4:3, 16:9 o en círculo. Mueve, haz zoom y descarga el resultado gratis.',
  },
  '/rotar-imagen': {
    title: 'Rotar y voltear imagen online',
    description:
      'Gira tu imagen 90°, 180° o 270° y voltéala en horizontal o vertical. Gratis, rápido, sin registro y en tu navegador.',
  },
  '/heic-a-jpg': {
    title: 'HEIC a JPG: convierte fotos de iPhone',
    description:
      'Convierte fotos HEIC o HEIF de tu iPhone a JPG o PNG para abrirlas en cualquier equipo. Gratis y sin registro.',
  },
  '/quitar-fondo': {
    title: 'Quitar fondo de imagen online',
    description:
      'Deja el fondo de tu imagen transparente y descarga un PNG. Funciona mejor con personas y se procesa en tu navegador.',
  },
}

// Páginas informativas (no son herramientas): entran al sitemap con schema WebPage.
export const legalSeo: Record<string, SeoEntry> = {
  '/preguntas-frecuentes': {
    title: 'Preguntas frecuentes',
    description:
      'Resuelve tus dudas sobre MarianTools: si es gratis, qué pasa con tus archivos, cómo funcionan los créditos de IA y más.',
  },
  '/comentarios': {
    title: 'Comentarios y sugerencias',
    description:
      'Cuéntanos qué herramienta te falta, qué mejorarías o qué no funciona en MarianTools. Tu opinión nos ayuda a mejorar el sitio.',
  },
  '/privacidad': {
    title: 'Política de privacidad',
    description:
      'Qué datos usa MarianTools, qué se procesa en tu navegador, qué se envía a la IA y cómo ejercer tus derechos.',
  },
  '/terminos': {
    title: 'Términos de uso',
    description:
      'Condiciones de uso de MarianTools: herramientas gratuitas, créditos de IA, alcance de los resultados y responsabilidades.',
  },
  '/contacto': {
    title: 'Contacto',
    description:
      'Escribe a MarianTools por correo para hacer consultas, reportar errores o enviar solicitudes sobre tus datos personales.',
  },
}

export const toTitle =(entry: SeoEntry) => `${entry.title} | ${SITE_NAME}`

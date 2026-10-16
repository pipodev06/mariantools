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
    title: 'Imagen a Base64 online',
    description:
      'Convierte imágenes a Base64 o Data URL al instante, directo en tu navegador y sin subir nada a un servidor.',
  },
  '/contrasenas': {
    title: 'Generador de contraseñas seguras',
    description:
      'Crea contraseñas fuertes y aleatorias con la longitud y los caracteres que elijas. Se generan en tu navegador.',
  },
  '/qr': {
    title: 'Generador y lector de códigos QR',
    description:
      'Crea códigos QR personalizados o lee uno desde una imagen. Gratis, rápido y sin registro.',
  },
  '/comparador': {
    title: 'Comparador de textos online',
    description:
      'Compara dos textos o versiones y mira las diferencias por palabra o por línea al instante.',
  },
  '/paleta': {
    title: 'Paleta de colores desde una imagen',
    description:
      'Extrae los colores dominantes de cualquier foto y copia sus códigos para usarlos en tus diseños.',
  },
  '/facturas': {
    title: 'Extraer datos de facturas y recibos con IA',
    description:
      'Obtén fecha, monto, moneda, RUC, proveedor y número de comprobante de tus facturas y recibos con IA. Exporta los resultados a CSV.',
  },
  '/comprimir': {
    title: 'Comprimir y convertir imágenes online',
    description:
      'Reduce el peso de tus imágenes y conviértelas a JPG, PNG o WebP con poca pérdida de calidad, directo en tu navegador.',
  },
  '/imagen-a-pdf': {
    title: 'Imagen a PDF: une varias imágenes en un PDF',
    description:
      'Convierte una o varias imágenes en un solo archivo PDF. Ordena las páginas y descarga el resultado gratis.',
  },
  '/redimensionar': {
    title: 'Redimensionar imágenes para redes sociales',
    description:
      'Ajusta tus imágenes al tamaño exacto que pide cada red social con presets listos para usar.',
  },
  '/marca-de-agua': {
    title: 'Agregar marca de agua a imágenes y PDF',
    description:
      'Protege tus imágenes y documentos PDF con una marca de agua de texto o imagen. Gratis y en tu navegador.',
  },
  '/exif': {
    title: 'Ver metadatos EXIF de una foto',
    description:
      'Consulta la ubicación, la cámara y la fecha que guardan tus fotos en sus metadatos EXIF.',
  },
  '/editor-pdf': {
    title: 'Editor de PDF: unir, dividir y reordenar páginas',
    description:
      'Une varios PDF, divide uno en partes o reordena sus páginas. Todo gratis y sin instalar programas.',
  },
  '/firma-pdf': {
    title: 'Firmar PDF online con tu firma',
    description:
      'Dibuja o sube tu firma y colócala sobre cualquier página de un documento PDF. Gratis y sin registro.',
  },
  '/texto-a-voz': {
    title: 'Texto a voz online',
    description:
      'Convierte cualquier texto en audio narrado al instante con las voces de tu navegador.',
  },
  '/markdown': {
    title: 'Markdown a PDF y Word',
    description:
      'Convierte texto en Markdown a un PDF o a un documento Word con formato, listo para usar.',
  },
  '/calculadora-fechas': {
    title: 'Calculadora de fechas y días hábiles',
    description:
      'Calcula los días entre dos fechas, suma o resta días y cuenta solo los días hábiles.',
  },
  '/manuscrito': {
    title: 'Manuscrito a texto con IA',
    description:
      'Convierte letra a mano de una imagen en texto editable con IA. Copia o descarga la transcripción.',
  },
  '/extractor-tablas': {
    title: 'Extraer tablas de imágenes a CSV y Excel',
    description:
      'Convierte una tabla de una imagen en un archivo CSV listo para abrir en Excel, usando IA.',
  },
  '/traductor-imagen': {
    title: 'Traductor de imágenes con IA',
    description:
      'Lee el texto de una imagen y tradúcelo a español, inglés, portugués, francés, alemán o italiano.',
  },
  '/corrector': {
    title: 'Corrector ortográfico y gramatical online',
    description:
      'Corrige la ortografía, la gramática y la puntuación de tus textos con IA y copia el resultado.',
  },
  '/resumen': {
    title: 'Resumen de texto con IA',
    description:
      'Resume documentos largos en pocas oraciones, en un párrafo o en varios, según el largo que elijas.',
  },
  '/pdf-a-texto': {
    title: 'PDF a texto, incluso si está escaneado',
    description:
      'Extrae el texto de un PDF. Si está escaneado, lo lee con OCR directamente en tu navegador.',
  },
  '/audio-a-texto': {
    title: 'Audio a texto: transcribe notas de voz',
    description:
      'Transcribe notas de voz y grabaciones a texto con IA. Admite MP3, WAV, M4A y OGG.',
  },
  '/quitar-fondo': {
    title: 'Quitar fondo de imagen online',
    description:
      'Deja el fondo de tu imagen transparente y descarga un PNG. Funciona mejor con personas y se procesa en tu navegador.',
  },
}

export const toTitle = (entry: SeoEntry) => `${entry.title} | ${SITE_NAME}`

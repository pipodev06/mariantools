import type { TablerIcon } from '@tabler/icons-react'
import {
  IconScan,
  IconBinary,
  IconMicrophone,
  IconTable,
  IconReceipt2,
  IconWriting,
  IconPhotoOff,
  IconFileZip,
  IconFileTypePdf,
  IconLanguage,
  IconResize,
  IconPalette,
  IconRubberStamp,
  IconInfoCircle,
  IconFiles,
  IconSignature,
  IconVolume,
  IconTextSpellcheck,
  IconFileDescription,
  IconGitCompare,
  IconMarkdown,
  IconQrcode,
  IconKey,
  IconCalendar,
} from '@tabler/icons-react'

export const categories = ['Extracción', 'Imagen', 'PDF', 'Texto', 'Utilidades'] as const

export type Category = (typeof categories)[number]

export type Tool = {
  title: string
  description: string
  href?: string
  category: Category
  icon: TablerIcon
}

// El orden refleja prioridad: primero lo fundacional (facturas, OCR) y lo de más demanda.
export const availableTools: Tool[] = [
  {
    title: 'Facturas y recibos',
    description: 'Fecha, monto y RUC con IA',
    href: '/facturas',
    category: 'Extracción',
    icon: IconReceipt2,
  },
  {
    title: 'Imagen a texto',
    description: 'Con OCR e IA para conversiones',
    href: '/ocr',
    category: 'Extracción',
    icon: IconScan,
  },
  {
    title: 'PDF a texto',
    description: 'Incluso si está escaneado',
    href: '/pdf-a-texto',
    category: 'Extracción',
    icon: IconFileTypePdf,
  },
  {
    title: 'Audio a texto',
    description: 'Transcribe notas de voz',
    href: '/audio-a-texto',
    category: 'Extracción',
    icon: IconMicrophone,
  },
  {
    title: 'Manuscrito a texto',
    description: 'Reconoce letra a mano',
    href: '/manuscrito',
    category: 'Extracción',
    icon: IconWriting,
  },
  {
    title: 'Extractor de tablas',
    description: 'De imagen a CSV para Excel',
    href: '/extractor-tablas',
    category: 'Extracción',
    icon: IconTable,
  },
  {
    title: 'Quitar fondo de imagen',
    description: 'Fondo transparente al instante',
    href: '/quitar-fondo',
    category: 'Imagen',
    icon: IconPhotoOff,
  },
  {
    title: 'Traductor de imagen',
    description: 'OCR más traducción',
    href: '/traductor-imagen',
    category: 'Imagen',
    icon: IconLanguage,
  },
  {
    title: 'Comprimir/convertir imagen',
    description: 'Menos peso, otro formato',
    href: '/comprimir',
    category: 'Imagen',
    icon: IconFileZip,
  },
  {
    title: 'Redimensionar para redes',
    description: 'Presets para cada red social',
    href: '/redimensionar',
    category: 'Imagen',
    icon: IconResize,
  },
  {
    title: 'Imagen a PDF',
    description: 'Varias imágenes, un solo PDF',
    href: '/imagen-a-pdf',
    category: 'PDF',
    icon: IconFileTypePdf,
  },
  {
    title: 'Editor de PDF',
    description: 'Une, divide o reordena páginas',
    href: '/editor-pdf',
    category: 'PDF',
    icon: IconFiles,
  },
  {
    title: 'Firma digital en PDF',
    description: 'Tu firma sobre el documento',
    href: '/firma-pdf',
    category: 'PDF',
    icon: IconSignature,
  },
  {
    title: 'Marca de agua',
    description: 'Sobre imágenes o PDF',
    href: '/marca-de-agua',
    category: 'Imagen',
    icon: IconRubberStamp,
  },
  {
    title: 'Imagen a Base64',
    description: 'Data URL o base64 puro',
    href: '/base64',
    category: 'Imagen',
    icon: IconBinary,
  },
  {
    title: 'Paleta de colores',
    description: 'Colores dominantes de una foto',
    href: '/paleta',
    category: 'Imagen',
    icon: IconPalette,
  },
  {
    title: 'Metadatos EXIF',
    description: 'Ubicación, cámara y fecha',
    href: '/exif',
    category: 'Imagen',
    icon: IconInfoCircle,
  },
  {
    title: 'Resumen de texto',
    description: 'Documentos largos, en segundos',
    href: '/resumen',
    category: 'Texto',
    icon: IconFileDescription,
  },
  {
    title: 'Corrector ortográfico',
    description: 'Ortografía y gramática',
    href: '/corrector',
    category: 'Texto',
    icon: IconTextSpellcheck,
  },
  {
    title: 'Comparador de textos',
    description: 'Diferencias entre dos versiones',
    href: '/comparador',
    category: 'Texto',
    icon: IconGitCompare,
  },
  {
    title: 'Texto a voz',
    description: 'Audio narrado al instante',
    href: '/texto-a-voz',
    category: 'Texto',
    icon: IconVolume,
  },
  {
    title: 'Markdown a PDF/Word',
    description: 'Con formato listo para usar',
    href: '/markdown',
    category: 'Texto',
    icon: IconMarkdown,
  },
  {
    title: 'Generador/lector QR',
    description: 'Crea o lee al instante',
    href: '/qr',
    category: 'Utilidades',
    icon: IconQrcode,
  },
  {
    title: 'Contraseñas seguras',
    description: 'Fuertes y aleatorias',
    href: '/contrasenas',
    category: 'Utilidades',
    icon: IconKey,
  },
  {
    title: 'Calculadora de fechas',
    description: 'Días entre fechas, días hábiles',
    href: '/calculadora-fechas',
    category: 'Utilidades',
    icon: IconCalendar,
  },
]

export const upcomingTools: Tool[] = []

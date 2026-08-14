import type { TablerIcon } from '@tabler/icons-react'
import {
  IconScan,
  IconBinary,
  IconFileTypePdf,
  IconMicrophone,
  IconTable,
  IconReceipt2,
  IconWriting,
  IconPhotoOff,
  IconFileZip,
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

export type Tool = {
  title: string
  description: string
  href?: string
  category?: string
  icon: TablerIcon
}

export const availableTools: Tool[] = [
  {
    title: 'Imagen a texto',
    description: 'Con OCR e IA para conversiones',
    href: '/ocr',
    icon: IconScan,
  },
  {
    title: 'Imagen a Base64',
    description: 'Data URL o base64 puro',
    href: '/base64',
    category: 'Imagen',
    icon: IconBinary,
  },
  {
    title: 'Contraseñas seguras',
    description: 'Fuertes y aleatorias',
    href: '/contrasenas',
    category: 'Otros',
    icon: IconKey,
  },
]

export const upcomingTools: Tool[] = [
  {
    title: 'PDF a texto',
    description: 'Incluso si está escaneado',
    category: 'Extracción / conversión',
    icon: IconFileTypePdf,
  },
  {
    title: 'Audio a texto',
    description: 'Transcribe notas de voz',
    category: 'Extracción / conversión',
    icon: IconMicrophone,
  },
  {
    title: 'Extractor de tablas',
    description: 'De imagen o PDF a Excel/CSV',
    category: 'Extracción / conversión',
    icon: IconTable,
  },
  {
    title: 'Facturas y recibos',
    description: 'Fecha, monto y RUC con IA',
    category: 'Extracción / conversión',
    icon: IconReceipt2,
  },
  {
    title: 'Manuscrito a texto',
    description: 'Reconoce letra a mano',
    category: 'Extracción / conversión',
    icon: IconWriting,
  },
  {
    title: 'Quitar fondo de imagen',
    description: 'Fondo transparente al instante',
    category: 'Imagen',
    icon: IconPhotoOff,
  },
  {
    title: 'Comprimir/convertir imagen',
    description: 'Menos peso, otro formato',
    category: 'Imagen',
    icon: IconFileZip,
  },
  {
    title: 'Imagen a PDF',
    description: 'Varias imágenes, un solo PDF',
    category: 'Imagen',
    icon: IconFileTypePdf,
  },
  {
    title: 'Traductor de imagen',
    description: 'OCR más traducción',
    category: 'Imagen',
    icon: IconLanguage,
  },
  {
    title: 'Redimensionar para redes',
    description: 'Presets para cada red social',
    category: 'Imagen',
    icon: IconResize,
  },
  {
    title: 'Paleta de colores',
    description: 'Colores dominantes de una foto',
    category: 'Imagen',
    icon: IconPalette,
  },
  {
    title: 'Marca de agua',
    description: 'Sobre imágenes o PDF',
    category: 'Imagen',
    icon: IconRubberStamp,
  },
  {
    title: 'Metadatos EXIF',
    description: 'Ubicación, cámara y fecha',
    category: 'Imagen',
    icon: IconInfoCircle,
  },
  {
    title: 'Editor de PDF',
    description: 'Une, divide o reordena páginas',
    category: 'PDF',
    icon: IconFiles,
  },
  {
    title: 'Firma digital en PDF',
    description: 'Tu firma sobre el documento',
    category: 'PDF',
    icon: IconSignature,
  },
  {
    title: 'Texto a voz',
    description: 'Audio narrado al instante',
    category: 'Texto',
    icon: IconVolume,
  },
  {
    title: 'Corrector ortográfico',
    description: 'Ortografía y gramática',
    category: 'Texto',
    icon: IconTextSpellcheck,
  },
  {
    title: 'Resumen de texto',
    description: 'Documentos largos, en segundos',
    category: 'Texto',
    icon: IconFileDescription,
  },
  {
    title: 'Comparador de textos',
    description: 'Diferencias entre dos versiones',
    category: 'Texto',
    icon: IconGitCompare,
  },
  {
    title: 'Markdown a PDF/Word',
    description: 'Con formato listo para usar',
    category: 'Texto',
    icon: IconMarkdown,
  },
  {
    title: 'Generador/lector QR',
    description: 'Crea o lee al instante',
    category: 'Otros',
    icon: IconQrcode,
  },
  {
    title: 'Calculadora de fechas',
    description: 'Días entre fechas, días hábiles',
    category: 'Otros',
    icon: IconCalendar,
  },
]

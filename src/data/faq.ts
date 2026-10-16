// Preguntas frecuentes generales del sitio. Datos puros (sin React): los usa la página `/preguntas-frecuentes`
// y `scripts/prerender.mjs` para el HTML estático y el JSON-LD FAQPage. Las de cada herramienta están en `toolInfo.ts`.

export type FaqItem = { q: string; a: string }

export const faq: FaqItem[] = [
  {
    q: '¿MarianTools es gratis?',
    a: 'Sí. Todas las herramientas que no usan IA son gratis y sin registro. Las herramientas con IA tienen un cupo gratuito diario; pasado ese cupo consumen créditos de tu cuenta.',
  },
  {
    q: '¿Mis archivos se suben a algún servidor?',
    a: 'En las herramientas sin IA, no: todo se procesa dentro de tu navegador. Las herramientas marcadas con «IA» envían tu imagen, texto o audio a un proveedor de IA para procesarlo, y no lo guardamos.',
  },
  {
    q: '¿Cómo funcionan los créditos?',
    a: 'Cada uso de una herramienta con IA cuesta créditos (casi siempre 1). Cada herramienta indica su costo antes de usarla. Si la IA falla y no entrega resultado, el crédito se devuelve.',
  },
  {
    q: '¿Necesito una cuenta?',
    a: 'No para las herramientas gratuitas. Para usar IA más allá del cupo diario necesitas una cuenta: entras con tu correo, sin contraseña, y recibes créditos de bienvenida.',
  },
  {
    q: '¿Cuánto cuesta comprar créditos?',
    a: 'La compra de créditos aún no está disponible. Mientras tanto puedes usar el cupo gratuito diario y los créditos de bienvenida.',
  },
  {
    q: '¿Qué tan precisa es la IA?',
    a: 'Es muy útil, pero puede equivocarse, sobre todo con imágenes borrosas, letra a mano o audios con ruido. Revisa siempre cifras, nombres y RUC antes de usar un resultado.',
  },
  {
    q: '¿Las calculadoras laborales son exactas?',
    a: 'Son referenciales y siguen el régimen laboral general de Perú. No reemplazan una liquidación oficial: tu empleador o un contador debe confirmar los montos.',
  },
  {
    q: '¿Cómo elimino mi cuenta o mis datos?',
    a: 'Escríbenos desde la página de contacto y eliminamos tu cuenta y tus datos.',
  },
  {
    q: '¿Qué hago si una herramienta no funciona?',
    a: 'Prueba con otro archivo o recarga la página. Si sigue fallando, cuéntanos en la página de comentarios qué herramienta era y qué pasó.',
  },
]

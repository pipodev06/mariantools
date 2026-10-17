// Texto "Cómo usar" que se muestra debajo de cada herramienta (`ToolInfo`) y se escribe también en el
// HTML prerenderizado (`scripts/prerender.mjs`). Datos puros, sin imports de React. La clave es el
// `href` de la herramienta en `tools.ts`; una herramienta sin entrada aquí no muestra el bloque.

export type ToolInfoEntry = {
  steps: string[]
  tips?: string[]
  faq?: { q: string; a: string }[]
}

export const toolInfo: Record<string, ToolInfoEntry> = {
  '/facturas': {
    steps: [
      'Sube una o varias fotos o capturas de tus facturas o recibos (JPG, PNG o WebP).',
      'Pulsa el botón para extraer los datos con IA.',
      'Revisa fecha, monto, moneda, RUC, proveedor y número de comprobante.',
      'Corrige lo que haga falta y descarga todo en CSV para abrirlo en Excel.',
    ],
    tips: [
      'Usa fotos nítidas, con buena luz y sin recortar los bordes del comprobante.',
      'Revisa siempre el monto y el RUC: la IA puede equivocarse con imágenes borrosas.',
    ],
    faq: [
      {
        q: '¿Se guardan mis facturas?',
        a: 'No. La imagen se envía a un proveedor de IA para leerla y no la guardamos en nuestra base de datos.',
      },
      {
        q: '¿Cuánto cuesta?',
        a: 'Cada imagen usa 1 crédito, después de tus usos gratis del día.',
      },
      {
        q: '¿Qué datos extrae de una factura?',
        a: 'Fecha, monto, moneda, RUC, proveedor y número de comprobante, que puedes corregir y descargar en CSV.',
      },
    ],
  },
  '/comprimir-pdf': {
    steps: [
      'Elige tu archivo PDF.',
      'Selecciona el nivel de compresión: a más compresión, menos peso y menos calidad.',
      'Pulsa «Comprimir PDF» y espera a que termine.',
      'Descarga el PDF comprimido.',
    ],
    tips: [
      'Las páginas se convierten en imagen: el texto del PDF resultante ya no se puede seleccionar ni buscar.',
      'Si tu PDF es escaneado, la diferencia de calidad casi no se nota.',
    ],
    faq: [
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Se comprime dentro de tu navegador y el archivo no sale de tu equipo.',
      },
      {
        q: '¿Por qué el texto del PDF comprimido ya no se puede seleccionar?',
        a: 'Para reducir el peso, las páginas se convierten en imagen. Si necesitas el texto, conserva el PDF original.',
      },
    ],
  },
  '/calculadora-cts': {
    steps: [
      'Escribe tu sueldo mensual y, si corresponde, la asignación familiar.',
      'Agrega el promedio de tus remuneraciones variables (comisiones u horas extras), si las tienes.',
      'Indica los meses completos y los días adicionales del semestre.',
      'Lee la CTS a depositar y el detalle del cálculo.',
    ],
    tips: [
      'La CTS se deposita en mayo (semestre noviembre–abril) y en noviembre (semestre mayo–octubre).',
      'Este cálculo considera el régimen laboral general y es referencial.',
    ],
    faq: [
      {
        q: '¿Cómo se calcula?',
        a: 'Se toma tu remuneración computable más un sexto de la última gratificación. Ese total se divide entre 12 por cada mes completo y entre 360 por cada día adicional.',
      },
      {
        q: '¿Reemplaza una liquidación oficial?',
        a: 'No. Es una referencia: tu empleador o un contador debe confirmar el monto.',
      },
      {
        q: '¿Cuándo se deposita la CTS?',
        a: 'En mayo (semestre noviembre–abril) y en noviembre (semestre mayo–octubre).',
      },
    ],
  },
  '/ocr': {
    steps: [
      'Arrastra una o varias imágenes (JPG, PNG o WebP) o elígelas desde tu equipo.',
      'Elige si quieres leerlas gratis en tu navegador o con IA.',
      'Espera a que termine el reconocimiento de cada imagen.',
      'Revisa el texto, edítalo si hace falta y cópialo o descárgalo.',
    ],
    tips: [
      'Una foto recta, con buena luz y sin sombras da mejores resultados.',
      'El texto reconocido lleva un nivel de confianza: si sale bajo, revisa esa imagen con más cuidado.',
      'Para letra a mano usa «Manuscrito a texto».',
    ],
    faq: [
      {
        q: '¿Qué diferencia hay entre el modo gratis y la IA?',
        a: 'El modo gratis se procesa en tu navegador y no sube la imagen. La IA suele leer mejor fotos difíciles, pero envía la imagen a un proveedor y usa 1 crédito después de tus usos gratis del día.',
      },
      {
        q: '¿Qué formatos de imagen admite?',
        a: 'JPG, PNG y WebP, y puedes subir varias imágenes a la vez.',
      },
      {
        q: '¿Puedo pasar una foto a texto desde el celular?',
        a: 'Sí. Funciona en el navegador del celular: elige o toma la foto y pulsa para convertirla.',
      },
    ],
  },
  '/pdf-a-texto': {
    steps: [
      'Elige tu archivo PDF.',
      'Pulsa el botón para extraer el texto.',
      'Si el PDF es un escaneo, se lee con OCR automáticamente.',
      'Copia el texto o descárgalo.',
    ],
    tips: ['Los PDF escaneados tardan más porque cada página se lee como imagen.'],
    faq: [
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Todo se procesa en tu navegador.',
      },
      {
        q: '¿Funciona con PDF escaneados?',
        a: 'Sí. Si el PDF no tiene texto seleccionable, cada página se lee con OCR en tu navegador, por eso tarda más.',
      },
    ],
  },
  '/audio-a-texto': {
    steps: [
      'Elige un archivo de audio (MP3, WAV, M4A u OGG) de hasta 20 MB.',
      'Pulsa el botón para transcribir y espera: los audios largos se procesan por partes.',
      'Revisa la transcripción y cópiala o descárgala.',
    ],
    tips: [
      'Un audio con poco ruido de fondo se transcribe mejor.',
      'Revisa nombres propios y cifras: la IA puede equivocarse.',
    ],
    faq: [
      {
        q: '¿Cuánto cuesta?',
        a: 'Cada ~100 segundos de audio usa 1 crédito, después de tus usos gratis del día.',
      },
      {
        q: '¿Se guarda mi audio?',
        a: 'No lo guardamos. Se envía a un proveedor de IA solo para transcribirlo.',
      },
      {
        q: '¿Qué formatos de audio admite?',
        a: 'MP3, WAV, M4A u OGG, de hasta 20 MB.',
      },
    ],
  },
  '/manuscrito': {
    steps: [
      'Sube una foto o escaneo de tu texto escrito a mano.',
      'Pulsa «Transcribir».',
      'Revisa el texto y cópialo o descárgalo.',
    ],
    tips: [
      'Fotografía la hoja de frente, con buena luz y letra legible.',
      'Si la letra es muy difícil, la IA puede confundir palabras: revisa el resultado.',
    ],
    faq: [
      {
        q: '¿Cuánto cuesta?',
        a: 'Cada imagen usa 1 crédito, después de tus usos gratis del día.',
      },
    ],
  },
  '/extractor-tablas': {
    steps: [
      'Sube una imagen o captura que contenga una tabla.',
      'Pulsa «Extraer tabla».',
      'Revisa las filas y columnas detectadas.',
      'Descarga el CSV y ábrelo en Excel o Google Sheets.',
    ],
    tips: [
      'Recorta la imagen para que solo se vea la tabla.',
      'Comprueba las cifras: la IA puede equivocar un dígito en imágenes pequeñas.',
    ],
    faq: [
      {
        q: '¿Cuánto cuesta?',
        a: 'Cada imagen usa 2 créditos, después de tus usos gratis del día.',
      },
    ],
  },
  '/traductor-imagen': {
    steps: [
      'Sube una imagen con texto.',
      'Elige el idioma de destino: español, inglés, portugués, francés, alemán o italiano.',
      'Pulsa «Traducir».',
      'Copia o descarga la traducción.',
    ],
    tips: ['Cuanto más nítido el texto de la imagen, más fiel la traducción.'],
    faq: [
      {
        q: '¿Cuánto cuesta?',
        a: 'Cada imagen usa 1 crédito, después de tus usos gratis del día.',
      },
    ],
  },
  '/corrector': {
    steps: [
      'Pega o escribe tu texto.',
      'Pulsa «Corregir».',
      'Compara con el original y copia el texto corregido.',
    ],
    tips: [
      'Revisa el resultado: la IA corrige ortografía, gramática y puntuación, pero puede cambiar el estilo.',
    ],
    faq: [
      {
        q: '¿Cuánto cuesta?',
        a: 'Cada corrección usa 1 crédito, después de tus usos gratis del día.',
      },
      {
        q: '¿Qué pasa con mi texto?',
        a: 'Se envía a un proveedor de IA para corregirlo y no lo guardamos.',
      },
    ],
  },
  '/resumen': {
    steps: [
      'Pega el texto que quieres resumir.',
      'Elige el largo del resumen: corto, medio o largo.',
      'Pulsa «Resumir».',
      'Copia el resumen.',
    ],
    tips: ['Para documentos muy largos, resume por partes y luego junta los resúmenes.'],
    faq: [
      {
        q: '¿Cuánto cuesta?',
        a: 'Cada resumen usa 1 crédito, después de tus usos gratis del día.',
      },
    ],
  },
  '/quitar-fondo': {
    steps: [
      'Sube una imagen.',
      'Espera a que se quite el fondo.',
      'Descarga el PNG con fondo transparente.',
    ],
    tips: [
      'Funciona mejor con personas y con un sujeto bien separado del fondo.',
      'La primera vez se descarga el modelo de IA al navegador y puede tardar un poco.',
    ],
    faq: [
      {
        q: '¿Mi imagen se sube a un servidor?',
        a: 'No. El fondo se quita dentro de tu navegador.',
      },
      {
        q: '¿Qué formato obtengo?',
        a: 'Un PNG con fondo transparente, listo para usar en otros diseños.',
      },
      {
        q: '¿Por qué tarda la primera vez?',
        a: 'La primera vez se descarga el modelo de IA al navegador. Después puede ser más rápido.',
      },
    ],
  },
  '/comprimir': {
    steps: [
      'Sube una o varias imágenes.',
      'Elige el formato de salida (JPG, PNG o WebP) y la calidad.',
      'Si necesitas un peso exacto, escribe el máximo en KB y se ajusta solo.',
      'Comprueba el peso resultante.',
      'Descarga las imágenes comprimidas.',
    ],
    tips: [
      'Para un peso máximo, usa JPG o WebP: PNG no admite ajuste de calidad.',
      'Si no alcanza el peso pedido, se reducen también las dimensiones de la imagen.',
      'WebP y JPG pesan menos que PNG para fotografías.',
      'Bajar la calidad reduce el peso, pero también el detalle.',
    ],
    faq: [
      {
        q: '¿Mis imágenes se suben a un servidor?',
        a: 'No. Todo se procesa en tu navegador.',
      },
      {
        q: '¿Cómo reduzco una imagen a un peso exacto, por ejemplo 100 KB?',
        a: 'Elige JPG o WebP y escribe el máximo en KB: la calidad se ajusta sola. Si no alcanza, también se reducen las dimensiones de la imagen.',
      },
    ],
  },
  '/redimensionar': {
    steps: [
      'Sube una imagen.',
      'Elige el preset de la red social o el tamaño que necesitas.',
      'Ajusta cómo encaja la imagen y el fondo si sobra espacio.',
      'Descarga la imagen ya redimensionada.',
    ],
    tips: ['Revisa la vista previa antes de descargar para confirmar que no se corta nada importante.'],
    faq: [
      {
        q: '¿Mi imagen se sube a un servidor?',
        a: 'No. Se redimensiona dentro de tu navegador.',
      },
    ],
  },
  '/recortar-imagen': {
    steps: [
      'Sube una imagen.',
      'Elige la forma del recorte: 1:1, 4:3, 16:9, 3:4, 9:16 o círculo.',
      'Mueve la imagen y usa el zoom hasta encuadrar lo que quieres.',
      'Pulsa «Recortar» y descarga el resultado.',
    ],
    tips: ['El recorte en círculo se descarga en PNG con fondo transparente.'],
    faq: [
      {
        q: '¿Pierdo calidad al recortar?',
        a: 'No se reduce la resolución: se recorta el área elegida a su tamaño original.',
      },
    ],
  },
  '/rotar-imagen': {
    steps: [
      'Sube una imagen.',
      'Elige el giro (90° a la derecha, 180° o 90° a la izquierda) y si quieres voltearla.',
      'Pulsa «Aplicar» y descarga la imagen corregida.',
    ],
    tips: ['Voltear horizontal crea un espejo; voltear vertical la pone de cabeza.'],
    faq: [
      {
        q: '¿Se mantiene el formato?',
        a: 'Sí. Una imagen JPG, PNG o WebP se entrega en el mismo formato.',
      },
    ],
  },
  '/heic-a-jpg': {
    steps: [
      'Sube una foto en formato HEIC o HEIF, como las que toma un iPhone.',
      'Elige si la quieres en JPG o en PNG.',
      'Pulsa «Convertir» y descarga la foto.',
    ],
    tips: [
      'JPG pesa menos; PNG conserva mejor los detalles.',
      'La primera conversión puede tardar un poco mientras se carga el convertidor.',
    ],
    faq: [
      {
        q: '¿Por qué no puedo abrir mis fotos HEIC?',
        a: 'HEIC es el formato que usa el iPhone y no todos los programas lo abren. Pasarlas a JPG las hace compatibles con cualquier equipo.',
      },
    ],
  },
  '/marca-de-agua': {
    steps: [
      'Sube una imagen o un PDF.',
      'Elige una marca de agua de texto o de imagen.',
      'Ajusta tamaño, color y opacidad.',
      'Descarga el archivo con la marca de agua; en un PDF se aplica a todas las páginas.',
    ],
    tips: ['Una opacidad media protege el archivo sin tapar el contenido.'],
    faq: [
      {
        q: '¿Mi archivo se sube a un servidor?',
        a: 'No. La marca de agua se aplica dentro de tu navegador.',
      },
    ],
  },
  '/imagen-a-pdf': {
    steps: [
      'Sube una o varias imágenes.',
      'Ordénalas con las flechas y quita las que no quieras en el PDF.',
      'Pulsa para crear el PDF.',
      'Descarga el archivo.',
    ],
    tips: ['Cada imagen se convierte en una página.'],
    faq: [
      {
        q: '¿Mis imágenes se suben a un servidor?',
        a: 'No. El PDF se crea dentro de tu navegador.',
      },
    ],
  },
  '/editor-pdf': {
    steps: [
      'Sube uno o varios PDF; si subes varios, se unen en el orden en que los agregaste.',
      'Reordena las páginas con las flechas y quita las que no necesites.',
      'Descarga el PDF final, o descarga una sola página.',
    ],
    tips: ['Quitar páginas te permite dividir un PDF: deja solo las que quieres y descarga.'],
    faq: [
      {
        q: '¿Mis PDF se suben a un servidor?',
        a: 'No. Todo se procesa en tu navegador.',
      },
      {
        q: '¿Cómo uno varios PDF en uno solo?',
        a: 'Sube todos los PDF: se unen en el orden en que los agregaste. Reordena las páginas con las flechas y descarga el resultado.',
      },
      {
        q: '¿Cómo divido un PDF?',
        a: 'Quita las páginas que no quieres, deja solo las que necesitas y descarga. También puedes descargar una sola página.',
      },
    ],
  },
  '/firma-pdf': {
    steps: [
      'Dibuja tu firma en el recuadro con el mouse o con el dedo.',
      'Sube el PDF que quieres firmar.',
      'Elige la página y la posición de la firma.',
      'Pulsa «Firmar PDF» y descarga el documento.',
    ],
    tips: ['Usa «Limpiar» si no te gusta el trazo y dibújala de nuevo.'],
    faq: [
      {
        q: '¿Es una firma digital con validez legal?',
        a: 'Es una imagen de tu firma colocada sobre el documento, no un certificado digital. Su validez depende de a quién se la presentes.',
      },
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Se firma dentro de tu navegador.',
      },
      {
        q: '¿Puedo firmar un PDF desde el celular?',
        a: 'Sí. Dibuja tu firma con el dedo en el recuadro, sube el PDF y colócala en la página que quieras.',
      },
    ],
  },
  '/pdf-a-jpg': {
    steps: [
      'Elige tu archivo PDF.',
      'Pulsa «Convertir a JPG».',
      'Descarga el ZIP con una imagen por página.',
    ],
    tips: ['Los PDF con muchas páginas tardan más en convertirse.'],
    faq: [
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Todo se procesa en tu navegador.',
      },
      {
        q: '¿Cuántas imágenes obtengo?',
        a: 'Una imagen JPG por cada página del PDF, todas juntas en un archivo ZIP.',
      },
    ],
  },
  '/pdf-a-word': {
    steps: [
      'Elige tu archivo PDF.',
      'Pulsa «Convertir a Word».',
      'Descarga el documento .docx y edítalo.',
    ],
    tips: [
      'Solo pasa el texto: no conserva el diseño, las columnas ni las imágenes originales.',
      'Si el PDF es un escaneo, se lee con OCR y puede tener errores que debes revisar.',
    ],
    faq: [
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Todo se procesa en tu navegador.',
      },
      {
        q: '¿Conserva el formato del PDF?',
        a: 'No. Solo pasa el texto; el diseño, las columnas y las imágenes originales no se conservan.',
      },
    ],
  },
  '/rotar-pdf': {
    steps: [
      'Elige tu archivo PDF.',
      'Selecciona el giro: 90°, 180° o 270°.',
      'Pulsa «Rotar PDF» y descarga el resultado.',
    ],
    tips: ['El giro se aplica a todas las páginas del documento.'],
    faq: [
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Se procesa en tu navegador.',
      },
    ],
  },
  '/numerar-paginas-pdf': {
    steps: [
      'Elige tu archivo PDF.',
      'Selecciona la posición y el formato del número.',
      'Indica con qué número empezar.',
      'Pulsa «Numerar páginas» y descarga el PDF.',
    ],
    tips: ['Empieza en 0 si la primera página es una portada que no quieres contar.'],
    faq: [
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Se procesa en tu navegador.',
      },
    ],
  },
  '/recortar-pdf': {
    steps: [
      'Elige tu archivo PDF.',
      'Escribe cuántos milímetros quitar arriba, abajo, a la izquierda y a la derecha.',
      'Pulsa «Recortar PDF» y descarga el resultado.',
    ],
    tips: ['El recorte se aplica a todas las páginas por igual.'],
    faq: [
      {
        q: '¿Mi PDF se sube a un servidor?',
        a: 'No. Se procesa en tu navegador.',
      },
    ],
  },
  '/qr': {
    steps: [
      'Elige el tipo de código: URL, texto, WiFi o contacto.',
      'Completa los datos.',
      'Descarga el código QR generado.',
      'Para leer un QR, sube una imagen que lo contenga.',
    ],
    tips: ['Prueba el QR con tu celular antes de imprimirlo o compartirlo.'],
    faq: [
      {
        q: '¿Se guardan mis datos?',
        a: 'No. El QR se genera y se lee en tu navegador.',
      },
      {
        q: '¿Qué puedo guardar en un código QR?',
        a: 'Una URL, un texto o los datos de una red WiFi. También puedes leer un QR existente subiendo una imagen.',
      },
    ],
  },
  '/comparador': {
    steps: [
      'Pega el texto original en el primer cuadro.',
      'Pega el texto nuevo en el segundo.',
      'Mira las diferencias resaltadas, por palabra o por línea.',
    ],
    tips: ['Úsalo para comparar versiones de un contrato, un correo o un código.'],
    faq: [
      {
        q: '¿Mis textos se suben a un servidor?',
        a: 'No. La comparación se hace en tu navegador.',
      },
    ],
  },
  '/texto-a-voz': {
    steps: [
      'Escribe o pega el texto que quieres escuchar.',
      'Elige una voz y ajusta la velocidad.',
      'Pulsa para reproducir.',
    ],
    tips: ['Las voces disponibles dependen de tu navegador y de tu sistema operativo.'],
    faq: [
      {
        q: '¿Mi texto se sube a un servidor?',
        a: 'No. La voz se genera en tu navegador.',
      },
    ],
  },
  '/markdown': {
    steps: [
      'Escribe o pega tu texto en Markdown.',
      'Descarga el resultado como PDF o como documento Word.',
    ],
    tips: ['Usa # para títulos, ** para negrita y - para listas.'],
    faq: [
      {
        q: '¿Mi texto se sube a un servidor?',
        a: 'No. La conversión se hace en tu navegador.',
      },
    ],
  },
  '/calculadora-fechas': {
    steps: [
      'Elige la operación: días entre dos fechas, o sumar o restar días a una fecha.',
      'Indica las fechas o la cantidad de días.',
      'Activa los días hábiles si solo quieres contar los laborables.',
      'Lee el resultado.',
    ],
    tips: ['Los días hábiles no incluyen sábados ni domingos.'],
    faq: [
      {
        q: '¿Considera los feriados?',
        a: 'No. Descuenta fines de semana, pero no los feriados de cada país.',
      },
    ],
  },
  '/base64': {
    steps: [
      'Sube una imagen para obtener su Base64 o su Data URL.',
      'Copia el resultado.',
      'Para el camino inverso, pega un Base64 o un Data URL y obtén la imagen.',
    ],
    tips: ['Un Data URL se puede usar directo en el atributo src de una imagen en HTML.'],
    faq: [
      {
        q: '¿Mi imagen se sube a un servidor?',
        a: 'No. La conversión se hace en tu navegador.',
      },
    ],
  },
  '/paleta': {
    steps: [
      'Sube una foto.',
      'Mira los colores dominantes que se detectan.',
      'Copia el código del color que necesites.',
    ],
    tips: ['Una imagen con colores bien definidos da una paleta más útil.'],
    faq: [
      {
        q: '¿Mi imagen se sube a un servidor?',
        a: 'No. Los colores se calculan en tu navegador.',
      },
    ],
  },
  '/exif': {
    steps: [
      'Sube una foto.',
      'Revisa los metadatos encontrados: fecha, cámara, lente, exposición y más.',
      'Si la foto tiene ubicación, también se muestra.',
    ],
    tips: [
      'Muchas redes sociales y apps de mensajes borran los metadatos; una foto original del celular o de la cámara los conserva.',
      'Antes de compartir una foto, revisa si guarda tu ubicación.',
    ],
    faq: [
      {
        q: '¿Mi foto se sube a un servidor?',
        a: 'No. Los metadatos se leen en tu navegador.',
      },
    ],
  },
  '/contrasenas': {
    steps: [
      'Elige la longitud y los tipos de caracteres que quieres incluir.',
      'Genera la contraseña y mira su nivel de seguridad.',
      'Cópiala y guárdala en un gestor de contraseñas.',
    ],
    tips: [
      'Cuanto más larga, más segura.',
      'No repitas la misma contraseña en varios sitios.',
    ],
    faq: [
      {
        q: '¿Se guardan las contraseñas que genero?',
        a: 'No. Se generan en tu navegador y no salen de él.',
      },
    ],
  },
  '/calculadora-gratificacion': {
    steps: [
      'Escribe tu sueldo mensual y, si corresponde, la asignación familiar.',
      'Agrega el promedio de tus remuneraciones variables.',
      'Indica los meses completos trabajados en el semestre (0 a 6) y tu seguro de salud.',
      'Lee la gratificación, la bonificación extraordinaria y el total.',
    ],
    tips: [
      'Se paga en julio (semestre enero–junio) y en diciembre (semestre julio–diciembre).',
      'Solo cuentan los meses completos trabajados.',
    ],
    faq: [
      {
        q: '¿Cómo se calcula?',
        a: 'Tu remuneración computable se multiplica por los meses completos y se divide entre 6. A eso se suma la bonificación extraordinaria: 9 % si aportas a EsSalud o 6.75 % si tienes EPS.',
      },
      {
        q: '¿Reemplaza una liquidación oficial?',
        a: 'No. Es referencial y corresponde al régimen laboral general. Tu empleador o un contador debe confirmar el monto.',
      },
      {
        q: '¿Cuándo se paga la gratificación?',
        a: 'En julio, por el semestre enero–junio, y en diciembre, por el semestre julio–diciembre.',
      },
      {
        q: '¿Qué es la bonificación extraordinaria?',
        a: 'Es un adicional que se suma a la gratificación: 9 % si aportas a EsSalud o 6.75 % si tienes EPS.',
      },
    ],
  },
  '/calculadora-liquidacion': {
    steps: [
      'Indica tu fecha de ingreso y tu fecha de cese.',
      'Escribe tu sueldo mensual, la asignación familiar y el promedio de variables.',
      'Elige tu seguro de salud (EsSalud o EPS).',
      'Lee la CTS, las vacaciones y la gratificación truncas, con el total estimado.',
    ],
    tips: [
      'Asume que no gozaste las vacaciones del último año de servicio.',
      'No incluye indemnizaciones ni descuentos.',
    ],
    faq: [
      {
        q: '¿Qué significa «trunca»?',
        a: 'Es la parte proporcional de un beneficio por el tiempo trabajado cuando el contrato termina antes de completar el período.',
      },
      {
        q: '¿Reemplaza una liquidación oficial?',
        a: 'No. Es una estimación del régimen laboral general. Tu empleador o un contador debe confirmar el monto.',
      },
      {
        q: '¿Qué beneficios incluye?',
        a: 'La CTS trunca, las vacaciones truncas y la gratificación trunca. No incluye indemnizaciones ni descuentos.',
      },
    ],
  },
  '/calculadora-horas-extras': {
    steps: [
      'Escribe tu sueldo mensual y las horas de tu jornada diaria.',
      'Indica cuántas horas extras hiciste al 25 % y cuántas al 35 %.',
      'Lee el valor de la hora normal y el pago de cada tramo.',
    ],
    tips: [
      'Las dos primeras horas extras del día se pagan con 25 % de recargo y desde la tercera con 35 %.',
    ],
    faq: [
      {
        q: '¿Cómo se calcula?',
        a: 'El valor de la hora normal es el sueldo dividido entre 30 y entre las horas de la jornada. Luego se multiplica por 1.25 o por 1.35 según el tramo.',
      },
      {
        q: '¿Reemplaza el cálculo de planilla?',
        a: 'No. Es referencial: tu empleador o un contador debe confirmar el pago.',
      },
      {
        q: '¿Cuánto se paga la hora extra en Perú?',
        a: 'Las dos primeras horas extras del día se pagan con 25 % de recargo sobre la hora normal, y desde la tercera con 35 %.',
      },
    ],
  },
  '/calculadora-igv': {
    steps: [
      'Elige si quieres agregar o quitar el IGV.',
      'Escribe el monto y revisa la tasa (18 % por defecto).',
      'Lee el valor sin IGV, el IGV y el total.',
    ],
    tips: [
      'Para agregar IGV, escribe el valor sin IGV; para quitarlo, escribe el total con IGV.',
    ],
    faq: [
      {
        q: '¿Puedo cambiar la tasa?',
        a: 'Sí. La tasa es editable, aunque en Perú el IGV general es de 18 % (incluye el 2 % del Impuesto de Promoción Municipal).',
      },
    ],
  },
  '/validador-ruc': {
    steps: [
      'Escribe el número de RUC de 11 dígitos.',
      'Lee si es válido y a qué tipo de contribuyente corresponde.',
    ],
    tips: ['Los RUC de personas naturales empiezan con 10 y los de empresas con 20.'],
    faq: [
      {
        q: '¿Confirma que el RUC existe en SUNAT?',
        a: 'No. Solo comprueba el formato y el dígito verificador. Para saber si está activo, consulta a SUNAT.',
      },
      {
        q: '¿Cómo sé si un RUC es de una persona o de una empresa?',
        a: 'Los RUC de personas naturales empiezan con 10 y los de empresas con 20.',
      },
    ],
  },
  '/numero-a-letras': {
    steps: ['Escribe el monto con decimales si los tiene.', 'Elige la moneda: soles, dólares o sin moneda.', 'Copia el texto en letras.'],
    tips: ['Los céntimos se escriben como fracción de 100, como en las facturas: 50/100.'],
    faq: [
      { q: '¿Hasta qué monto funciona?', a: 'Hasta 999 999 999 999,99.' },
      { q: '¿Cómo se escribe 1 000 en una factura?', a: 'MIL CON 00/100 SOLES. Delante de «mil» no se escribe «un».' },
    ],
  },
  '/calculadora-sueldo-neto': {
    steps: [
      'Escribe tu sueldo bruto mensual.',
      'Elige tu sistema de pensiones (AFP u ONP) y tu seguro de salud.',
      'Si estás en una AFP, elige cuál y el tipo de comisión.',
      'Lee cada descuento y tu sueldo neto.',
    ],
    tips: [
      'La ONP descuenta 13 %. La AFP descuenta 10 % para tu fondo, más la prima de seguro y la comisión.',
      'Con comisión mixta, la AFP cobra sobre tu saldo acumulado y no sobre tu sueldo.',
    ],
    faq: [
      { q: '¿Qué valores usa?', a: 'UIT 2026 de S/ 5 500 y las tasas de AFP publicadas por la SBS para 2026: prima de seguro 1.37 % y comisiones de 1.47 % a 1.69 % según la AFP.' },
      { q: '¿Reemplaza mi boleta de pago?', a: 'No. Es referencial: tu empleador puede tener otros descuentos o ingresos.' },
    ],
  },
  '/calculadora-renta-quinta': {
    steps: [
      'Escribe tu sueldo bruto mensual y tu seguro de salud.',
      'Agrega otros ingresos del año, como bonos o utilidades, si los tienes.',
      'Lee el impuesto anual y la retención mensual aproximada.',
    ],
    tips: ['Si tu sueldo anual no supera 7 UIT (S/ 38 500 en 2026), no pagas renta de quinta.'],
    faq: [
      { q: '¿Cómo se calcula?', a: 'Se suman 12 sueldos, 2 gratificaciones con su bonificación extraordinaria y los otros ingresos. Se restan 7 UIT y al resto se aplica la escala: 8 % hasta 5 UIT, 14 % hasta 20, 17 % hasta 35, 20 % hasta 45 y 30 % por encima.' },
      { q: '¿Por qué mi retención real es distinta?', a: 'SUNAT reparte la retención de forma escalonada durante el año y tu empleador recalcula cuando cambian tus ingresos. Aquí se muestra el promedio: impuesto anual entre 12.' },
    ],
  },
  '/escanear-documento': {
    steps: [
      'Toma una foto de la hoja con el celular o sube una foto.',
      'Arrastra los cuatro círculos hasta las esquinas del documento.',
      'Elige color o blanco y negro y pulsa «Enderezar».',
      'Descarga el documento en JPG o en PDF.',
    ],
    tips: ['Fotografía la hoja sobre una superficie oscura y con buena luz: las esquinas se ven mejor.', 'Para leer el texto después, usa «Imagen a texto» con el JPG.'],
    faq: [{ q: '¿Mi foto se sube a un servidor?', a: 'No. La corrección se hace dentro de tu navegador.' }],
  },
  '/contador-palabras': {
    steps: ['Escribe o pega tu texto.', 'Mira al instante las palabras, caracteres, oraciones, párrafos y el tiempo de lectura.'],
    tips: ['El tiempo de lectura usa 200 palabras por minuto, y en voz alta, 130.'],
    faq: [{ q: '¿Mi texto se sube a un servidor?', a: 'No. Se cuenta dentro de tu navegador.' }],
  },
  '/codigo-de-barras': {
    steps: ['Elige el tipo de código: EAN-13 o Code 128.', 'Escribe el número o el texto.', 'Descarga el código en PNG.'],
    tips: [
      'En EAN-13 puedes escribir 12 dígitos y el verificador se calcula solo.',
      'Code 128 acepta letras, números y signos, pero no tildes ni ñ.',
    ],
    faq: [
      { q: '¿Puedo usar cualquier número EAN-13 en mis productos?', a: 'Para venderlos en tiendas necesitas códigos asignados por GS1 Perú. Para uso interno, como inventario, puedes generar los tuyos.' },
    ],
  },
}

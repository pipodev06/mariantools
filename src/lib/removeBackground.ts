// MODNet (Apache-2.0) vía transformers.js, 100% en el navegador. Se importa de forma
// dinámica para que la librería y el modelo (~25 MB) solo se carguen al usar la tool.
const MODEL_ID = 'Xenova/modnet'

type Loaded = {
  tf: typeof import('@huggingface/transformers')
  model: Awaited<ReturnType<(typeof import('@huggingface/transformers'))['AutoModel']['from_pretrained']>>
  processor: Awaited<
    ReturnType<(typeof import('@huggingface/transformers'))['AutoProcessor']['from_pretrained']>
  >
}

let loading: Promise<Loaded> | null = null

const load = (onProgress?: (percent: number) => void): Promise<Loaded> => {
  loading ??= (async () => {
    const tf = await import('@huggingface/transformers')
    // Porcentaje por archivo: se reporta el del archivo en descarga (suficiente para mostrar avance).
    const progress_callback = (info: { status?: string; progress?: number }) => {
      if (info.status === 'progress' && typeof info.progress === 'number') {
        onProgress?.(Math.round(info.progress))
      }
    }
    const [model, processor] = await Promise.all([
      tf.AutoModel.from_pretrained(MODEL_ID, { dtype: 'fp32', progress_callback }),
      tf.AutoProcessor.from_pretrained(MODEL_ID),
    ])
    return { tf, model, processor }
  })().catch((err) => {
    loading = null
    throw err
  })
  return loading
}

/** Devuelve un PNG con el fondo transparente. Funciona mejor con personas. */
export const removeBackground = async (
  file: File,
  onModelProgress?: (percent: number) => void,
): Promise<Blob> => {
  let loaded: Loaded
  try {
    loaded = await load(onModelProgress)
  } catch {
    throw new Error('No se pudo cargar el modelo. Revisa tu conexión e inténtalo de nuevo.')
  }
  const { tf, model, processor } = loaded

  const image = (await tf.RawImage.fromBlob(file)).rgb()
  const { pixel_values } = await processor(image)
  const { output } = await model({ input: pixel_values })

  const mask = await tf.RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(
    image.width,
    image.height,
  )
  return image.rgba().putAlpha(mask).toBlob('image/png')
}

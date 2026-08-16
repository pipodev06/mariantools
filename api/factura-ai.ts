import type { VercelRequest, VercelResponse } from '@vercel/node'

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const MISTRAL_MODEL = 'pixtral-12b-2409'

const EXTRACT_PROMPT =
  'Analiza esta imagen de una factura o recibo y extrae los siguientes datos. ' +
  'Responde ÚNICAMENTE con un JSON válido, sin texto adicional ni markdown, con esta forma exacta: ' +
  '{"fecha": string o null, "monto": string o null, "moneda": string o null, "ruc": string o null, ' +
  '"proveedor": string o null, "numero_comprobante": string o null}. ' +
  'Si un dato no aparece claramente en la imagen, usa null. No inventes valores.'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'MISTRAL_API_KEY no configurada en el servidor' })
    return
  }

  const { image } = req.body as { image?: string }
  if (!image) {
    res.status(400).json({ error: 'Falta la imagen (data URL en base64)' })
    return
  }

  try {
    const mistralResponse = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACT_PROMPT },
              { type: 'image_url', image_url: image },
            ],
          },
        ],
      }),
    })

    if (!mistralResponse.ok) {
      const errorBody = await mistralResponse.text()
      res.status(mistralResponse.status).json({ error: `Mistral API: ${errorBody}` })
      return
    }

    const data = (await mistralResponse.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const raw = data.choices?.[0]?.message?.content ?? '{}'
    res.status(200).json({ raw })
  } catch {
    res.status(500).json({ error: 'No se pudo contactar a la API de Mistral' })
  }
}

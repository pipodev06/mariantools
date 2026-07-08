import type { VercelRequest, VercelResponse } from '@vercel/node'

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const MISTRAL_MODEL = 'pixtral-12b-2409'

const EXTRACT_PROMPT =
  'Extrae todo el texto de esta imagen tal cual aparece, respetando el orden de lectura ' +
  'y los saltos de línea. Responde únicamente con el texto extraído, sin comentarios ni ' +
  'explicaciones adicionales.'

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
    const text = data.choices?.[0]?.message?.content ?? ''
    res.status(200).json({ text })
  } catch {
    res.status(500).json({ error: 'No se pudo contactar a la API de Mistral' })
  }
}

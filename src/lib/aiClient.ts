/** Llama a `api/ai.ts`, que arma el prompt de cada tarea y le pega al proveedor de IA configurado (key server-side). */
export const callAi = async (body: Record<string, unknown>): Promise<string> => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error ?? 'No se pudo completar la operación con IA')
  }

  const { result } = (await response.json()) as { result: string }
  return result.trim()
}

import type { SupabaseClient } from '@supabase/supabase-js'

let client: Promise<SupabaseClient | null> | null = null

/**
 * Cliente de Supabase con la clave pública (anon): la seguridad la dan las políticas RLS.
 * Devuelve null si no hay variables VITE_SUPABASE_*. Se carga bajo demanda para no sumar
 * la librería al bundle de las páginas que no usan cuentas.
 */
export const getSupabase = (): Promise<SupabaseClient | null> => {
  client ??= (async () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
    if (!url || !key) return null
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(url, key)
  })()
  return client
}

/** Header con la sesión del usuario (si la hay) para que el servidor identifique su cuenta. */
export const authHeaders = async (): Promise<Record<string, string>> => {
  const supabase = await getSupabase()
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

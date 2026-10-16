import { useEffect, useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authHeaders, getSupabase } from './supabase'

/**
 * Estado de la cuenta compartido por toda la app (header, franja de cada herramienta, Home, /cuenta):
 * una sola sesión, un solo saldo y un solo cupo gratis, en vez de que cada pieza consulte por su lado.
 */
export type AccountState = {
  /** `off`: la app no tiene Supabase configurado (sin cuentas). */
  status: 'loading' | 'off' | 'anon' | 'user'
  email: string | null
  balance: number | null
  /** Usos gratis que quedan hoy; null mientras no se sepa o si no hay medición. */
  freeLeft: number | null
  freeLimit: number | null
}

let state: AccountState = {
  status: 'loading',
  email: null,
  balance: null,
  freeLeft: null,
  freeLimit: null,
}
const listeners = new Set<() => void>()
let started = false

const update = (patch: Partial<AccountState>) => {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

const loadBalance = async () => {
  const supabase = await getSupabase()
  if (!supabase || state.status !== 'user') return
  const { data } = await supabase.from('credit_accounts').select('balance').maybeSingle()
  update({ balance: data?.balance ?? 0 })
}

/** Consulta cuántos usos gratis le quedan hoy al visitante o usuario. */
export const refreshQuota = async () => {
  try {
    const response = await fetch('/api/quota', { headers: await authHeaders() })
    if (!response.ok) return
    const { limit, remaining } = (await response.json()) as { limit: number; remaining: number | null }
    update({ freeLimit: limit, freeLeft: remaining })
  } catch {
    // Es informativo: si falla, la franja simplemente no muestra el cupo.
  }
}

/** Vuelve a leer saldo y cupo; se llama después de cada uso de IA. */
export const refreshAccount = () => {
  void loadBalance()
  if (state.freeLimit !== null) void refreshQuota()
}

const applySession = (session: Session | null) => {
  if (session) {
    update({ status: 'user', email: session.user.email ?? null, balance: null, freeLeft: null })
    void loadBalance()
  } else {
    update({ status: 'anon', email: null, balance: null, freeLeft: null })
  }
}

const start = async () => {
  if (started) return
  started = true
  const supabase = await getSupabase()
  if (!supabase) return update({ status: 'off' })

  const { data } = await supabase.auth.getSession()
  applySession(data.session)
  supabase.auth.onAuthStateChange((_event, session) => {
    // Diferido: Supabase no admite llamar a su cliente de forma síncrona dentro de este callback.
    setTimeout(() => applySession(session), 0)
  })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useAccount = (): AccountState => {
  useEffect(() => {
    void start()
  }, [])
  return useSyncExternalStore(subscribe, () => state)
}

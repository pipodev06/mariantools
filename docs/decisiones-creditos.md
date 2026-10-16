# Créditos y medición de IA (2026-10-16)

Objetivo: que cada usuario pague lo que consume de IA y quede margen (>= US$1 por paquete aun gastando todo).

## Modelo
- **Créditos prepagados**: 1 crédito = 1 uso de IA (imagen o texto). Tabla = 2; audio = 1 por trozo de ~100 s. Costos en `TASK_COST` (`api/ai.ts`) y `AUDIO_CHUNK_COST` (`api/transcribe.ts`).
- **Cupo gratis diario** por visitante (hash de IP) o usuario: `FREE_DAILY_USES` (3). Día según hora de Lima. Agotado el cupo: sin cuenta 401 (`login_required`), con cuenta se descuentan créditos; sin saldo 402 (`no_credits`).
- **Bienvenida**: 5 créditos al registrarse (trigger `handle_new_user`).
- **Paquetes** (propuesta en `src/lib/credits.ts`): 100/US$2, 300/US$5, 800/US$12. Costo de IA estimado ~US$0.003/uso (estimación propia, no medida); comisión de PayPal u otro procesador sin verificar.
- Si la IA falla se devuelve el uso (créditos o cupo gratis) antes de responder el error.
- `max_tokens` = 4096 por llamada para acotar el costo de salida.

## Piezas
- `supabase/migrations/20261016000000_credits.sql`: tablas `credit_accounts`, `credit_ledger`, `free_usage`; RLS (el usuario solo lee lo suyo); funciones `spend_credits`, `refund_credits`, `grant_credits`, `consume_free_quota`, `refund_free_quota` solo para `service_role`. Movimientos idempotentes por `ref` (el webhook de pagos puede reintentar).
- `api/_billing.ts` (módulo interno, no endpoint): `reserve`, `refund`, `grant`, `getUserId`. Habla con Supabase por REST con la service_role key (solo servidor). Sin Supabase configurado: dev permite, producción cierra con 503.
- `api/dev-grant.ts`: acredita créditos de prueba; **404 en producción** (`NODE_ENV`).
- Cliente: `src/lib/supabase.ts` (carga bajo demanda), `aiClient.ts` (`AiError` con `code`, `authHeaders`), página `/cuenta` (login por enlace al correo, saldo, movimientos, paquetes "Próximamente"), `AiErrorNotice` (enlace a /cuenta cuando falta sesión o saldo).
- `api/tsconfig.json` con tipos de Node (sin él `vercel build` mostraba errores de tipos). Verificado con `vercel build`: el módulo `_billing` queda dentro de la función y `_billing` no es endpoint.

## Pendiente
- **Cobro real**: no hay cuenta de comercio. Opción discutida: PayPal (Orders API + webhook que llame a `grant_credits` con el id de pago como `ref`). No se verificaron comisiones ni requisitos para cuentas en Perú. Revisar obligaciones tributarias con un contador.
- Aplicar la migración en un proyecto Supabase **propio de MarianTools** (el único proyecto visible en la cuenta, `apolo-core-prod`, es de otro producto: no se tocó).
- Variables en `.env.local` y en Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secreta), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `FREE_DAILY_USES`, `BILLING_SALT`.
- Limpiar `free_usage` de días viejos (tarea programada) cuando haya tráfico.
- Abuso de bienvenida con correos desechables: considerar bajar o quitar los 5 créditos.

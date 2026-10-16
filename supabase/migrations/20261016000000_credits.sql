-- Créditos prepagados, cupo gratis diario y su registro de movimientos.
-- Solo el servidor (service_role) puede modificar saldos: los usuarios únicamente leen lo suyo.

create table public.credit_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in ('spend', 'refund', 'grant', 'signup')),
  tool text,
  -- Clave de idempotencia: evita acreditar o devolver dos veces el mismo movimiento.
  ref text,
  created_at timestamptz not null default now()
);

create unique index credit_ledger_ref_key on public.credit_ledger (ref) where ref is not null;
create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

create table public.free_usage (
  key text not null,
  day date not null,
  uses integer not null default 0,
  primary key (key, day)
);

alter table public.credit_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.free_usage enable row level security;

create policy "Ver mi cuenta" on public.credit_accounts
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Ver mis movimientos" on public.credit_ledger
  for select to authenticated using (user_id = (select auth.uid()));

-- free_usage no tiene políticas: ningún cliente puede leerla ni escribirla.

-- Descuenta créditos de forma atómica. Devuelve el saldo nuevo, o -1 si no alcanza.
create function public.spend_credits(p_user uuid, p_amount integer, p_tool text, p_ref text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  update public.credit_accounts
     set balance = balance - p_amount, updated_at = now()
   where user_id = p_user and balance >= p_amount
  returning balance into v_balance;

  if not found then
    return -1;
  end if;

  insert into public.credit_ledger (user_id, delta, reason, tool, ref)
  values (p_user, -p_amount, 'spend', p_tool, p_ref);
  return v_balance;
end;
$$;

-- Devuelve créditos cuando la IA falla. Idempotente por p_ref.
create function public.refund_credits(p_user uuid, p_amount integer, p_tool text, p_ref text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  insert into public.credit_ledger (user_id, delta, reason, tool, ref)
  values (p_user, p_amount, 'refund', p_tool, 'refund:' || p_ref)
  on conflict (ref) where ref is not null do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    update public.credit_accounts
       set balance = balance + p_amount, updated_at = now()
     where user_id = p_user;
  end if;
end;
$$;

-- Acredita créditos (compra o ajuste manual). Idempotente por p_ref: el webhook de pagos
-- puede reintentar sin duplicar el saldo.
create function public.grant_credits(p_user uuid, p_amount integer, p_reason text, p_ref text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  insert into public.credit_accounts (user_id, balance) values (p_user, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_ledger (user_id, delta, reason, tool, ref)
  values (p_user, p_amount, 'grant', p_reason, p_ref)
  on conflict (ref) where ref is not null do nothing;
  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    update public.credit_accounts
       set balance = balance + p_amount, updated_at = now()
     where user_id = p_user;
  end if;

  select balance into v_balance from public.credit_accounts where user_id = p_user;
  return v_balance;
end;
$$;

-- Consume un uso del cupo gratis del día (hora de Lima). Devuelve false si ya se agotó.
create function public.consume_free_quota(p_key text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Lima')::date;
  v_uses integer;
begin
  if p_limit <= 0 then
    return false;
  end if;

  insert into public.free_usage (key, day, uses) values (p_key, v_today, 1)
  on conflict (key, day) do update set uses = public.free_usage.uses + 1
    where public.free_usage.uses < p_limit
  returning uses into v_uses;

  return v_uses is not null;
end;
$$;

-- Devuelve un uso del cupo gratis cuando la IA falla.
create function public.refund_free_quota(p_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.free_usage
     set uses = greatest(uses - 1, 0)
   where key = p_key and day = (now() at time zone 'America/Lima')::date;
$$;

-- Cada usuario nuevo recibe su cuenta con un saldo de bienvenida.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.credit_accounts (user_id, balance) values (new.id, 5);
  insert into public.credit_ledger (user_id, delta, reason, ref)
  values (new.id, 5, 'signup', 'signup:' || new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Solo el servidor puede ejecutar estas funciones.
revoke all on function public.spend_credits(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.grant_credits(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.consume_free_quota(text, integer) from public, anon, authenticated;
revoke all on function public.refund_free_quota(text) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.spend_credits(uuid, integer, text, text) to service_role;
grant execute on function public.refund_credits(uuid, integer, text, text) to service_role;
grant execute on function public.grant_credits(uuid, integer, text, text) to service_role;
grant execute on function public.consume_free_quota(text, integer) to service_role;
grant execute on function public.refund_free_quota(text) to service_role;

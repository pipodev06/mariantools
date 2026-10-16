-- Comentarios y sugerencias de los visitantes. Solo el servidor (service_role) escribe y lee:
-- la tabla no tiene políticas, así que ningún cliente puede acceder a ella.

create table public.feedback (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('sugerencia', 'comentario', 'error')),
  message text not null check (char_length(message) between 10 and 2000),
  email text check (email is null or char_length(email) <= 200),
  page text check (page is null or char_length(page) <= 200),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index feedback_created_idx on public.feedback (created_at desc);
create index feedback_user_idx on public.feedback (user_id) where user_id is not null;

alter table public.feedback enable row level security;

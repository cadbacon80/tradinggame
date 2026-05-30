-- Trading game: room state for late-join + reconnect.
-- Active gameplay broadcasts over Realtime channels; this table is the durable mirror.

create table if not exists rooms (
  id            text primary key,                       -- 4-char uppercase room code
  state         jsonb not null,                         -- full Room object
  version       integer not null default 0,
  updated_at    timestamptz not null default now()
);

create index if not exists rooms_updated_at on rooms (updated_at);

-- Permissive RLS for v1 (party game, no PII, no $). Tighten in v2.
alter table rooms enable row level security;

drop policy if exists "rooms anon read" on rooms;
create policy "rooms anon read"
  on rooms for select
  to anon
  using (true);

drop policy if exists "rooms anon upsert" on rooms;
create policy "rooms anon upsert"
  on rooms for insert
  to anon
  with check (true);

drop policy if exists "rooms anon update" on rooms;
create policy "rooms anon update"
  on rooms for update
  to anon
  using (true)
  with check (true);

-- Optional cleanup helper. Run as a cron via pg_cron, or call from an Edge Function.
-- delete from rooms where updated_at < now() - interval '1 hour';

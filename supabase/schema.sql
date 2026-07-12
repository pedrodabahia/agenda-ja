-- ============================================
-- AgendaFlow — Schema base (Tier 1 / grátis) — versão Vite
-- Rode isso no SQL Editor do seu projeto Supabase
-- ============================================

create extension if not exists "pgcrypto";

-- 1. NEGÓCIOS
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text not null check (type in ('barbearia', 'academia', 'estudio', 'outro')),
  whatsapp text not null,
  created_at timestamptz default now()
);

-- 2. SERVIÇOS
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  duration_minutes int default 30,
  created_at timestamptz default now()
);

-- 3. HORÁRIOS DISPONÍVEIS
create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  service_id uuid references services(id) on delete cascade,
  slot_time timestamptz not null,
  created_at timestamptz default now()
);

-- 4. RESERVAS
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references availability_slots(id) on delete cascade not null unique,
  customer_name text,
  customer_phone text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'expired', 'cancelled')),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz default now()
);

create index if not exists idx_businesses_slug on businesses(slug);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
--
-- Como aqui é o browser que escreve direto (sem backend no meio),
-- a segurança TODA mora nessas policies. São propositalmente restritas:
-- qualquer um pode CRIAR um negócio/reserva, mas ninguém pode
-- editar ou apagar dado de outra pessoa por essa chave pública.
-- ============================================
alter table businesses enable row level security;
alter table services enable row level security;
alter table availability_slots enable row level security;
alter table bookings enable row level security;

-- Leitura pública (necessária pra página /:slug funcionar)
create policy "Leitura pública de negócios" on businesses for select using (true);
create policy "Leitura pública de serviços" on services for select using (true);
create policy "Leitura pública de horários" on availability_slots for select using (true);
create policy "Leitura pública de reservas (pra saber o que já foi ocupado)" on bookings for select using (true);

-- Criação pública (o form de cadastro precisa disso)
create policy "Qualquer um pode cadastrar um negócio" on businesses for insert with check (true);
create policy "Qualquer um pode cadastrar serviços" on services for insert with check (true);
create policy "Qualquer um pode cadastrar horários" on availability_slots for insert with check (true);
create policy "Qualquer um pode reservar um horário" on bookings for insert with check (true);

-- Propositalmente SEM policy de update/delete:
-- isso bloqueia qualquer edição ou remoção pela chave pública (anon).
-- Se precisar editar/apagar depois (Tier 2), isso passa a exigir
-- Supabase Auth + policy checando "auth.uid() = dono do negócio".

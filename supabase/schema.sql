-- Only Members — Supabase Schema

-- Ciudades
create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  slug text unique not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Eventos
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  subtitle text,
  city_id uuid references cities(id),
  country text not null,
  date_start timestamptz,
  date_end timestamptz,
  timezone text default 'America/Buenos_Aires',
  status text check (status in ('draft','soon','active','closed','archived')) default 'draft',
  secret_location boolean default false,
  location_name text,
  location_address text,
  location_lat numeric,
  location_lng numeric,
  progress_value integer default 0 check (progress_value between 0 and 100),
  cover_image text,
  hero_image text,
  description_es text,
  description_en text,
  subtitle_en text,
  tagline text,
  dress_code text,
  dress_code_images text[],
  price numeric,
  currency text default 'USD',
  purchase_link text,
  purchase_link_expires_at timestamptz,
  capacity integer,
  publish_at timestamptz,
  close_registrations_at timestamptz,
  og_title text,
  og_description text,
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Speakers
create table speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  role text,
  bio text,
  photo text,
  link text,
  visible boolean default false,
  order_index integer default 0
);

-- Partners
create table partners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  logo text,
  link text,
  order_index integer default 0
);

-- Registrations
create table registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text,
  city text,
  dni text,
  gender text,
  instagram text,
  language text default 'es',
  status text check (status in ('pending','invited','confirmed','declined','purchased','waitlist','imported','vip')) default 'pending',
  ref_code text,
  rsvp_token text unique default gen_random_uuid()::text,
  is_vip boolean default false,
  tags text[],
  internal_notes text,
  checkin_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email logs
create table email_logs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id),
  type text check (type in ('confirmation','invitation','purchase','location_reveal','rsvp_reminder')),
  sent_at timestamptz default now(),
  status text default 'sent',
  resend_id text,
  opened_at timestamptz,
  clicked_at timestamptz
);

-- Referral codes
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  code text unique not null,
  name text,
  clicks integer default 0,
  registrations integer default 0,
  conversions integer default 0,
  created_at timestamptz default now()
);

-- Blacklist
create table blacklist (
  id uuid primary key default gen_random_uuid(),
  email text,
  dni text,
  reason text,
  created_at timestamptz default now()
);

-- Email templates
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  subject_es text,
  subject_en text,
  body_es text,
  body_en text,
  created_at timestamptz default now()
);

-- Pre-registrations
create table pre_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  first_name text not null,
  email text not null,
  converted boolean default false,
  created_at timestamptz default now()
);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at before update on events
  for each row execute function set_updated_at();

create trigger registrations_updated_at before update on registrations
  for each row execute function set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table cities enable row level security;
alter table events enable row level security;
alter table registrations enable row level security;
alter table pre_registrations enable row level security;
alter table speakers enable row level security;
alter table partners enable row level security;
alter table email_logs enable row level security;
alter table referral_codes enable row level security;
alter table blacklist enable row level security;
alter table email_templates enable row level security;

-- cities: public SELECT where active
create policy "cities_public_select" on cities
  for select using (active = true);

-- events: public SELECT for non-draft only
create policy "events_public_select" on events
  for select using (status != 'draft');

-- registrations: public INSERT
create policy "registrations_public_insert" on registrations
  for insert with check (true);

-- pre_registrations: public INSERT
create policy "pre_registrations_public_insert" on pre_registrations
  for insert with check (true);

-- speakers: public SELECT for visible only
create policy "speakers_public_select" on speakers
  for select using (visible = true);

-- partners: public SELECT
create policy "partners_public_select" on partners
  for select using (true);

-- ─── RPC functions ───────────────────────────────────────────────────────────

create or replace function increment_referral(code text)
returns void language plpgsql security definer as $$
begin
  update referral_codes
  set registrations = registrations + 1
  where referral_codes.code = increment_referral.code;
end;
$$;

-- ─── Seed data ────────────────────────────────────────────────────────────────

insert into cities (name, country, slug) values
  ('Buenos Aires', 'Argentina', 'buenos-aires'),
  ('Madrid', 'España', 'madrid');

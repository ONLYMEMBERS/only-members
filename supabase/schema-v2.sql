-- Only Members — Schema v2

-- Permisos de scanner
create table if not exists scanner_permissions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  event_id uuid references events(id),
  authorized_by uuid references auth.users(id),
  active boolean default true,
  last_scan_at timestamptz,
  scans_count integer default 0,
  created_at timestamptz default now()
);

-- Check-ins de puerta en tiempo real
create table if not exists door_checkins (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references registrations(id),
  member_list_id uuid,
  event_id uuid references events(id) not null,
  scanner_email text,
  scanner_name text,
  scanned_at timestamptz default now(),
  is_member boolean default false,
  result text check (result in ('valid','invalid','duplicate','wrong_event','not_found'))
    default 'valid',
  attendee_name text,
  attendee_dni text,
  attendee_email text
);

-- Permisos de admin por sección
create table if not exists admin_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text check (role in ('admin','director','vendor')) default 'vendor',
  allowed_sections text[] default array[]::text[],
  assigned_event_id uuid references events(id),
  created_by uuid references auth.users(id),
  active boolean default true,
  created_at timestamptz default now()
);

-- Lista de Members (antes VIP) por evento
create table if not exists member_list (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) not null,
  email text not null,
  name text,
  added_by uuid references auth.users(id),
  qr_sent boolean default false,
  qr_sent_at timestamptz,
  rsvp_token text unique default gen_random_uuid()::text,
  status text default 'added',
  created_at timestamptz default now(),
  unique(event_id, email)
);

-- Columna ip_address en registrations (para rate limiting)
alter table registrations
  add column if not exists ip_address text;

-- Agregar 'member' al check constraint de status en registrations
alter table registrations
  drop constraint if exists registrations_status_check;
alter table registrations
  add constraint registrations_status_check
  check (status in ('pending','invited','confirmed','declined','purchased','waitlist','imported','vip','member'));

-- RLS
alter table scanner_permissions enable row level security;
alter table door_checkins enable row level security;
alter table admin_permissions enable row level security;
alter table member_list enable row level security;

create policy "scanner_permissions_service" on scanner_permissions
  for all using (true) with check (true);
create policy "door_checkins_service" on door_checkins
  for all using (true) with check (true);
create policy "admin_permissions_service" on admin_permissions
  for all using (true) with check (true);
create policy "member_list_service" on member_list
  for all using (true) with check (true);

-- Índices para performance
create index if not exists door_checkins_event_idx on door_checkins(event_id);
create index if not exists door_checkins_scanned_at_idx on door_checkins(scanned_at desc);
create index if not exists scanner_permissions_email_idx on scanner_permissions(email);
create index if not exists admin_permissions_email_idx on admin_permissions(email);
create index if not exists member_list_event_idx on member_list(event_id);

-- ==============================================================================
-- RAKSHIKA — SUPABASE PRODUCTION SQL SCHEMA  v3.0
-- Run this in Supabase SQL Editor → New query → Run all
-- ==============================================================================

-- 1. ENABLE UUID EXTENSION
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. USER PROFILES
-- ==============================================================================
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  email         text,
  role          text default 'user',  -- user | police | cyber
  created_at    timestamptz default now()
);

alter table profiles enable row level security;
create policy "users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "police can view all profiles"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('police','cyber'))
  );

-- ==============================================================================
-- 3. SOS ALERTS (primary emergency session table)
-- ==============================================================================
create table if not exists sos_alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  user_name       text default 'Anonymous User',
  user_phone      text default '',
  latitude        double precision,
  longitude       double precision,
  status          text default 'active',
    -- active | acknowledged | assigned | in_progress | resolved
  emergency_type  text default 'normal',
    -- normal | silent | panic
  threat_level    text default 'medium',
    -- low | medium | high | critical
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  resolved_at     timestamptz
);

alter table sos_alerts enable row level security;

-- Any authenticated user can insert their own SOS
create policy "users can insert sos"
  on sos_alerts for insert
  with check (true);

-- Users can read their own; police/cyber can read all active
create policy "users read own sos"
  on sos_alerts for select
  using (
    user_id = auth.uid()::text
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('police','cyber')
    )
  );

-- Only police can update status
create policy "police can update sos"
  on sos_alerts for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('police','cyber')
    )
  );

-- ==============================================================================
-- 4. LOCATION TRACKING (high-frequency GPS pings)
-- ==============================================================================
create table if not exists location_tracking (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sos_alerts(id) on delete cascade,
  latitude    double precision not null,
  longitude   double precision not null,
  accuracy    double precision,
  speed       double precision,
  heading     double precision,
  timestamp   timestamptz default now()
);

create index if not exists idx_location_session on location_tracking(session_id, timestamp);

alter table location_tracking enable row level security;

create policy "users can insert location logs"
  on location_tracking for insert with check (true);

create policy "police can read all location logs"
  on location_tracking for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('police','cyber')
    )
    or exists (
      select 1 from sos_alerts s
      where s.id = location_tracking.session_id and s.user_id = auth.uid()::text
    )
  );

-- ==============================================================================
-- 5. INCIDENTS (community reports)
-- ==============================================================================
create table if not exists incidents (
  id           uuid primary key default gen_random_uuid(),
  category     text default 'General',
  description  text,
  location     text,
  latitude     double precision,
  longitude    double precision,
  anonymous    boolean default true,
  user_name    text default 'Anonymous',
  status       text default 'pending',  -- pending | reviewing | resolved
  created_at   timestamptz default now()
);

alter table incidents enable row level security;

create policy "anyone can insert incident"
  on incidents for insert with check (true);

create policy "police can read incidents"
  on incidents for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('police','cyber')
    )
  );

create policy "police can update incident"
  on incidents for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('police','cyber')
    )
  );

-- ==============================================================================
-- 6. REALTIME PUBLICATIONS
-- ==============================================================================
begin;
  drop publication if exists supabase_realtime cascade;
  create publication supabase_realtime for table sos_alerts, location_tracking, incidents;
commit;

-- ==============================================================================
-- 7. AUTO-UPDATE updated_at TRIGGER
-- ==============================================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sos_updated_at on sos_alerts;
create trigger trg_sos_updated_at
  before update on sos_alerts
  for each row execute function update_updated_at();

-- ==============================================================================
-- 8. SAMPLE DATA (optional — comment out in production)
-- ==============================================================================
-- Insert a demo police officer profile (replace UUID with actual auth user id)
-- insert into profiles (id, full_name, phone, role)
-- values ('00000000-0000-0000-0000-000000000001', 'Inspector Sharma', '+91 98765 00001', 'police');

-- ==============================================================================
-- 9. GUARDIAN LINKS & ADDITIONAL RLS POLICIES
-- ==============================================================================
create table if not exists guardian_links (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  guardian_id   uuid not null references profiles(id) on delete cascade,
  status        text default 'active',  -- active | pending
  created_at    timestamptz default now(),
  unique(user_id, guardian_id)
);

alter table guardian_links enable row level security;

-- Users can manage their own links, guardians can only read links they are a part of
create policy "users can insert guardian links"
  on guardian_links for insert with check (auth.uid() = user_id);

create policy "users can delete guardian links"
  on guardian_links for delete using (auth.uid() = user_id);

create policy "users and guardians can select links"
  on guardian_links for select using (auth.uid() = user_id or auth.uid() = guardian_id);

-- Additional select policies on profiles, sos_alerts, and location_tracking for guardians:
create policy "guardians can view linked profiles"
  on profiles for select using (
    exists (
      select 1 from guardian_links l
      where l.guardian_id = auth.uid() and l.user_id = profiles.id
    )
  );

create policy "guardians can view linked user sos"
  on sos_alerts for select using (
    exists (
      select 1 from guardian_links l
      where l.guardian_id = auth.uid() and l.user_id::text = sos_alerts.user_id
    )
  );

create policy "guardians can view linked user locations"
  on location_tracking for select using (
    exists (
      select 1 from sos_alerts s
      join guardian_links l on l.user_id::text = s.user_id
      where s.id = location_tracking.session_id and l.guardian_id = auth.uid()
    )
  );


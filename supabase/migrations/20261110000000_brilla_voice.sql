-- Brilla: published teacher-voice recordings.
-- Lives in the shared "poultrypro" Supabase project; everything is prefixed brilla_ / brilla-voice so it never
-- touches PoultryPro's tables. Safe to run more than once.

-- ------------------------------------------------------------------ staff (admins and recorders)
create table if not exists public.brilla_staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'recorder' check (role in ('admin', 'recorder')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  voices text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.brilla_staff enable row level security;

-- The Brilla owner's email: this account becomes the admin when it first registers.
create or replace function public.brilla_owner_email() returns text language sql immutable as $$ select 'nyamebabaku@gmail.com'::text $$;

create or replace function public.brilla_is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from brilla_staff where user_id = auth.uid() and role = 'admin' and status = 'active')
$$;

/** Whether the signed-in staff member may record/publish this voice ('akos', 'kwame', 'twi', 'ga'). */
create or replace function public.brilla_can_record(v text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from brilla_staff
    where user_id = auth.uid() and status = 'active' and (role = 'admin' or v = any (voices))
  )
$$;

drop policy if exists "brilla staff read own or admin" on public.brilla_staff;
create policy "brilla staff read own or admin" on public.brilla_staff for select using (user_id = auth.uid() or public.brilla_is_admin());

/**
 * Registers the signed-in user with Brilla. The owner's email becomes the active admin;
 * everyone else becomes a pending recorder until the admin approves them.
 */
create or replace function public.brilla_register(p_name text) returns public.brilla_staff
language plpgsql security definer set search_path = public as $$
declare
  me record;
  row brilla_staff;
begin
  select id, email into me from auth.users where id = auth.uid();
  if me.id is null then raise exception 'not signed in'; end if;
  select * into row from brilla_staff where user_id = me.id;
  if found then return row; end if;
  insert into brilla_staff (user_id, email, name, role, status)
  values (
    me.id, lower(me.email), coalesce(nullif(trim(p_name), ''), split_part(me.email, '@', 1)),
    case when lower(me.email) = brilla_owner_email() then 'admin' else 'recorder' end,
    case when lower(me.email) = brilla_owner_email() then 'active' else 'pending' end
  )
  returning * into row;
  return row;
end $$;

/** Admin: approve/suspend a staff member and choose the voices they record. */
create or replace function public.brilla_set_staff(p_user uuid, p_status text, p_voices text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not brilla_is_admin() then raise exception 'admin only'; end if;
  if p_user = auth.uid() then raise exception 'you cannot change your own access'; end if;
  update brilla_staff set status = p_status, voices = coalesce(p_voices, '{}') where user_id = p_user and role = 'recorder';
end $$;

/** Admin: remove a recorder's Brilla access (their recordings stay). */
create or replace function public.brilla_remove_staff(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not brilla_is_admin() then raise exception 'admin only'; end if;
  delete from brilla_staff where user_id = p_user and role = 'recorder';
end $$;

-- ------------------------------------------------------------------ published voice clips
-- One row per voice line. Families read published, not-deleted rows; older versions stay in storage
-- so a recording can be put back.
create table if not exists public.brilla_voice_clips (
  teacher text not null check (teacher in ('akos', 'kwame', 'twi', 'ga')),
  key text not null,                -- catalogue key (e.g. M-0247) or Twi/Ga word id
  path text not null,               -- file in the brilla-voice bucket
  version int not null default 1,
  published boolean not null default true,
  deleted boolean not null default false,
  flags text[] not null default '{}',
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (teacher, key)
);
alter table public.brilla_voice_clips enable row level security;

drop policy if exists "brilla clips public read" on public.brilla_voice_clips;
create policy "brilla clips public read" on public.brilla_voice_clips for select using ((published and not deleted) or public.brilla_can_record(teacher));
drop policy if exists "brilla clips staff insert" on public.brilla_voice_clips;
create policy "brilla clips staff insert" on public.brilla_voice_clips for insert with check (public.brilla_can_record(teacher));
drop policy if exists "brilla clips staff update" on public.brilla_voice_clips;
create policy "brilla clips staff update" on public.brilla_voice_clips for update using (public.brilla_can_record(teacher)) with check (public.brilla_can_record(teacher));

create index if not exists brilla_voice_clips_updated on public.brilla_voice_clips (updated_at);

-- ------------------------------------------------------------------ storage bucket
insert into storage.buckets (id, name, public) values ('brilla-voice', 'brilla-voice', true)
on conflict (id) do update set public = true;

-- Files are stored as <teacher>/<key>/v<version>.<ext>; staff may add files for voices they record.
-- Nobody deletes files through the API (deleting a recording only unpublishes it), so restores always work.
drop policy if exists "brilla voice public read" on storage.objects;
create policy "brilla voice public read" on storage.objects for select using (bucket_id = 'brilla-voice');
drop policy if exists "brilla voice staff upload" on storage.objects;
create policy "brilla voice staff upload" on storage.objects for insert with check (bucket_id = 'brilla-voice' and public.brilla_can_record(split_part(name, '/', 1)));

grant execute on function public.brilla_register(text), public.brilla_set_staff(uuid, text, text[]), public.brilla_remove_staff(uuid), public.brilla_is_admin(), public.brilla_can_record(text) to authenticated;

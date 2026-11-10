-- PoriKolpona Supabase schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 login_id text unique not null,
 role text not null default 'student' check (role in ('admin','student')),
 active boolean not null default true,
 name text not null default '', academic_year text not null default 'HSC 2027', college text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.chapters (
 id text primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 subject text not null check (subject in ('Physics','Chemistry','Biology','Higher Mathematics','ICT','Bangla','English')),
 paper text not null, chapter_number integer, name text not null, description text not null default '', notes text not null default '', master_link text not null default '', deadline timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.chapters add column if not exists status text check (status in ('ongoing','untouched','completed','revision'));
create index if not exists chapters_user_idx on public.chapters(user_id);
create table if not exists public.lectures (
 id text primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 chapter_id text not null references public.chapters(id) on delete cascade,
 lecture_number integer not null default 1, youtube_watched boolean not null default false, sheet_completed boolean not null default false,
 notes_completed boolean not null default false, practice_completed boolean not null default false,
 youtube_url text not null default '', sheet_url text not null default '', note text not null default '', updated_at timestamptz not null default now()
);
create index if not exists lectures_user_idx on public.lectures(user_id);
create table if not exists public.user_settings (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 theme text check (theme in ('light','dark') or theme is null), panda_nickname text not null default 'Professor Panda', focus_min integer not null default 0, updated_at timestamptz not null default now()
);
create table if not exists public.study_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 started_at timestamptz not null default now(), duration_minutes integer not null default 0, session_type text not null default 'focus'
);
create table if not exists public.activity_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null,
 event text not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,login_id,name,role) values(new.id, lower(coalesce(new.raw_user_meta_data->>'login_id', split_part(new.email,'@',1))), coalesce(new.raw_user_meta_data->>'name','Student'), 'student');
 insert into public.user_settings(user_id) values(new.id) on conflict do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created_pori on auth.users;
create trigger on_auth_user_created_pori after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and active=true); $$;
alter table public.profiles enable row level security;
alter table public.chapters enable row level security;
alter table public.lectures enable row level security;
alter table public.user_settings enable row level security;
alter table public.study_sessions enable row level security;
alter table public.activity_logs enable row level security;
drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles for update to authenticated using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
drop policy if exists chapters_owner_or_admin on public.chapters;
create policy chapters_owner_or_admin on public.chapters for all to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
drop policy if exists lectures_owner_or_admin on public.lectures;
create policy lectures_owner_or_admin on public.lectures for all to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
drop policy if exists settings_owner_or_admin on public.user_settings;
create policy settings_owner_or_admin on public.user_settings for all to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
drop policy if exists sessions_owner_or_admin on public.study_sessions;
create policy sessions_owner_or_admin on public.study_sessions for all to authenticated using (user_id=auth.uid() or public.is_admin()) with check (user_id=auth.uid() or public.is_admin());
drop policy if exists activity_read_admin on public.activity_logs;
create policy activity_read_admin on public.activity_logs for select to authenticated using (public.is_admin());
drop policy if exists activity_insert_self on public.activity_logs;
create policy activity_insert_self on public.activity_logs for insert to authenticated with check (user_id=auth.uid());

-- Prevent students from changing their own role, active status, or login ID.
create or replace function public.protect_profile_privileges() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is not null and auth.uid() = old.id then
   if new.role is distinct from old.role or new.active is distinct from old.active or new.login_id is distinct from old.login_id then
     raise exception 'Protected account fields can only be changed by the server administrator';
   end if;
 end if;
 return new;
end; $$;
drop trigger if exists protect_profile_privileges_trigger on public.profiles;
create trigger protect_profile_privileges_trigger before update on public.profiles for each row execute function public.protect_profile_privileges();

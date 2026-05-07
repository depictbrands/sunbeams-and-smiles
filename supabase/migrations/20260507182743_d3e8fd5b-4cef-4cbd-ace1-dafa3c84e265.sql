
-- Roles enum
create type public.app_role as enum ('admin', 'teacher', 'parent');

-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- private has_role to avoid recursion
create schema if not exists private;
create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
grant usage on schema private to authenticated;
grant execute on function private.has_role(uuid, public.app_role) to authenticated;

-- public has_role for SQL convenience (not granted to client roles)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;

-- Threads
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  assigned_teacher_id uuid references auth.users(id) on delete set null,
  subject text not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.message_threads enable row level security;
create index idx_threads_parent on public.message_threads(parent_id);
create index idx_threads_last_msg on public.message_threads(last_message_at desc);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index idx_messages_thread on public.messages(thread_id, created_at);

-- updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Auto profile + parent role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'parent');
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- bump thread activity
create or replace function public.bump_thread_activity()
returns trigger language plpgsql set search_path = public as $$
begin
  update public.message_threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end; $$;
revoke execute on function public.bump_thread_activity() from public, anon, authenticated;
create trigger trg_bump_thread after insert on public.messages
for each row execute function public.bump_thread_activity();

-- Profiles RLS
create policy "Users view own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "Staff view all profiles" on public.profiles for select using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('teacher','admin'))
);
create policy "Authenticated view teacher profiles" on public.profiles for select to authenticated using (
  exists (select 1 from public.user_roles ur where ur.user_id = profiles.user_id and ur.role = 'teacher')
);

-- user_roles RLS
create policy "Users view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Authenticated view teacher role rows" on public.user_roles for select to authenticated using (role = 'teacher');
create policy "Admins view all roles" on public.user_roles for select using (private.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

-- threads RLS
create policy "Parent views own threads" on public.message_threads for select using (auth.uid() = parent_id);
create policy "Parent creates own thread" on public.message_threads for insert with check (auth.uid() = parent_id);
create policy "Staff views all threads" on public.message_threads for select using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('teacher','admin'))
);
create policy "Staff updates threads" on public.message_threads for update using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('teacher','admin'))
);

-- messages RLS
create policy "Parent views messages in own threads" on public.messages for select using (
  exists (select 1 from public.message_threads t where t.id = thread_id and t.parent_id = auth.uid())
);
create policy "Parent posts in own threads" on public.messages for insert with check (
  auth.uid() = sender_id and exists (select 1 from public.message_threads t where t.id = thread_id and t.parent_id = auth.uid())
);
create policy "Staff views all messages" on public.messages for select using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('teacher','admin'))
);
create policy "Staff posts in any thread" on public.messages for insert with check (
  auth.uid() = sender_id and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('teacher','admin'))
);
create policy "Sender updates own message read state" on public.messages for update using (
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role in ('teacher','admin'))
  or exists (select 1 from public.message_threads t where t.id = messages.thread_id and t.parent_id = auth.uid())
);

-- Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_threads;
alter table public.messages replica identity full;
alter table public.message_threads replica identity full;

-- Avatars bucket
insert into storage.buckets (id, name, public) values ('avatars','avatars',true) on conflict (id) do nothing;

create policy "Avatar files readable by known object URL"
on storage.objects for select to public
using (
  bucket_id = 'avatars'
  and exists (select 1 from public.profiles p where p.avatar_url like '%' || storage.objects.name)
);
create policy "Users upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update own avatar" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own avatar" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

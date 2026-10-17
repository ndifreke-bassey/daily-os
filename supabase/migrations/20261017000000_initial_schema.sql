create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 48),
  color text not null default '#D4AF37' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  content text not null default '' check (char_length(content) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  compact_tasks boolean not null default false,
  date_format text not null default 'long' check (date_format in ('long', 'short')),
  updated_at timestamptz not null default now()
);

create index tasks_user_due_date_idx on public.tasks (user_id, due_date);
create index tasks_user_created_at_idx on public.tasks (user_id, created_at desc);
create index notes_user_updated_at_idx on public.notes (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.user_preferences enable row level security;

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.categories, public.tasks, public.notes, public.user_preferences to authenticated;

create policy "Users can read their profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can manage their categories" on public.categories
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can read their tasks" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their tasks" on public.tasks
  for insert to authenticated with check (
    (select auth.uid()) = user_id and
    (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy "Users can update their tasks" on public.tasks
  for update to authenticated using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id and
    (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy "Users can delete their tasks" on public.tasks
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can manage their notes" on public.notes
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can manage their preferences" on public.user_preferences
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));

  insert into public.user_preferences (user_id) values (new.id);
  insert into public.categories (user_id, name, color) values
    (new.id, 'Work', '#D4AF37'),
    (new.id, 'Personal', '#84A98C'),
    (new.id, 'Learning', '#8BA4B8');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
  for each row execute procedure public.set_updated_at();
create trigger preferences_set_updated_at before update on public.user_preferences
  for each row execute procedure public.set_updated_at();
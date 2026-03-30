-- ============================================================
-- StudyFlow Database Schema
-- Run this in Supabase → SQL Editor → New query
-- ============================================================

-- Profiles (one per auth user, extends auth.users)
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  role        text not null check (role in ('student', 'parent')),
  full_name   text,
  grade       text,
  color       text default 'bg-indigo-500',
  created_at  timestamptz default now()
);

-- Family links (parent → student relationships)
create table if not exists family_links (
  id          uuid default gen_random_uuid() primary key,
  parent_id   uuid references profiles(id) on delete cascade not null,
  student_id  uuid references profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(parent_id, student_id)
);

-- Classes (belong to a student)
create table if not exists classes (
  id          uuid default gen_random_uuid() primary key,
  student_id  uuid references profiles(id) on delete cascade not null,
  name        text not null,
  teacher     text,
  period      text,
  color       text default 'bg-indigo-500',
  created_at  timestamptz default now()
);

-- Materials (notes, handouts, assignments captured by student)
create table if not exists materials (
  id            uuid default gen_random_uuid() primary key,
  class_id      uuid references classes(id) on delete cascade not null,
  student_id    uuid references profiles(id) on delete cascade not null,
  title         text not null,
  type          text not null check (type in ('notes', 'assignment', 'handout')),
  content_text  text,
  photo_url     text,
  tags          text[] default '{}',
  created_at    timestamptz default now()
);

-- Assignments & Exams
create table if not exists assignments (
  id          uuid default gen_random_uuid() primary key,
  class_id    uuid references classes(id) on delete cascade not null,
  student_id  uuid references profiles(id) on delete cascade not null,
  title       text not null,
  type        text not null check (type in ('assignment', 'exam', 'quiz')),
  due_date    date not null,
  completed   boolean default false,
  description text,
  created_at  timestamptz default now()
);

-- Parent ↔ Student messages
create table if not exists messages (
  id            uuid default gen_random_uuid() primary key,
  sender_id     uuid references profiles(id) on delete cascade not null,
  recipient_id  uuid references profiles(id) on delete cascade not null,
  body          text not null,
  read          boolean default false,
  created_at    timestamptz default now()
);

-- AI-generated study sessions
create table if not exists study_sessions (
  id               uuid default gen_random_uuid() primary key,
  student_id       uuid references profiles(id) on delete cascade not null,
  assignment_id    uuid references assignments(id) on delete set null,
  title            text not null,
  scheduled_date   date not null,
  duration_minutes int default 30,
  completed        boolean default false,
  created_at       timestamptz default now()
);

-- ============================================================
-- Row Level Security (keeps each user's data private)
-- ============================================================

alter table profiles       enable row level security;
alter table family_links   enable row level security;
alter table classes        enable row level security;
alter table materials      enable row level security;
alter table assignments    enable row level security;
alter table messages       enable row level security;
alter table study_sessions enable row level security;

-- Profiles: users see their own, parents see linked students
create policy "profiles: own row" on profiles
  for all using (auth.uid() = id);

-- Family links
create policy "family_links: own links" on family_links
  for all using (auth.uid() = parent_id or auth.uid() = student_id);

-- Classes: student owns, parent of that student can read
create policy "classes: student owns" on classes
  for all using (auth.uid() = student_id);

create policy "classes: parent reads linked student" on classes
  for select using (
    student_id in (
      select student_id from family_links where parent_id = auth.uid()
    )
  );

-- Materials: same pattern
create policy "materials: student owns" on materials
  for all using (auth.uid() = student_id);

create policy "materials: parent reads" on materials
  for select using (
    student_id in (
      select student_id from family_links where parent_id = auth.uid()
    )
  );

-- Assignments
create policy "assignments: student owns" on assignments
  for all using (auth.uid() = student_id);

create policy "assignments: parent reads" on assignments
  for select using (
    student_id in (
      select student_id from family_links where parent_id = auth.uid()
    )
  );

-- Messages: sender or recipient can read
create policy "messages: sender or recipient" on messages
  for all using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Study sessions
create policy "study_sessions: student owns" on study_sessions
  for all using (auth.uid() = student_id);

create policy "study_sessions: parent reads" on study_sessions
  for select using (
    student_id in (
      select student_id from family_links where parent_id = auth.uid()
    )
  );

-- ============================================================
-- Auto-create profile on signup trigger
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for material photos
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict do nothing;

create policy "materials storage: student upload" on storage.objects
  for insert with check (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "materials storage: student read" on storage.objects
  for select using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

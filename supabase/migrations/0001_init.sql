-- Panel: interview management schema

create extension if not exists "pgcrypto";

create table if not exists interview_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  archived boolean default false,
  marking_criteria jsonb not null
    default '["Communication","Technical Knowledge","Problem Solving","Confidence & Attitude"]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists trainers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  type_id uuid references interview_types(id),
  trainer_id uuid references trainers(id),
  interview_mode text check (interview_mode in ('Mock Interview','Final Interview')) default 'Mock Interview',
  status text check (status in ('New','Interviewed','Selected','Rejected','Needs Retest')) default 'New',
  applied_date date default current_date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  type_id uuid references interview_types(id),
  difficulty text check (difficulty in ('Easy','Medium','Hard')) default 'Medium',
  question_text text not null,
  ideal_answer text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  type_id uuid references interview_types(id),
  trainer_id uuid references trainers(id),
  interview_mode text,
  date date default current_date,
  total_score int default 0,
  max_score int default 0,
  marking_scores jsonb not null default '[]'::jsonb,
  strengths text,
  improvements text,
  verdict text check (verdict in ('Strong Hire','Hire','No Hire','Strong No Hire','')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists interview_scorecard_items (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interviews(id) on delete cascade,
  question_id uuid references questions(id),
  question_text_snapshot text,
  score int default 0,
  notes text
);

create table if not exists profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  role text check (role in ('admin_interviewer','manager')) default 'admin_interviewer'
);

-- Indexes for common filters/lookups
create index if not exists idx_students_type on students(type_id);
create index if not exists idx_students_trainer on students(trainer_id);
create index if not exists idx_students_status on students(status);
create index if not exists idx_questions_type on questions(type_id);
create index if not exists idx_questions_difficulty on questions(difficulty);
create index if not exists idx_interviews_student on interviews(student_id);
create index if not exists idx_interviews_trainer on interviews(trainer_id);
create index if not exists idx_interviews_type on interviews(type_id);
create index if not exists idx_interviews_date on interviews(date);
create index if not exists idx_scorecard_interview on interview_scorecard_items(interview_id);

-- Row Level Security: any authenticated user can read/write everything.
alter table interview_types enable row level security;
alter table trainers enable row level security;
alter table students enable row level security;
alter table questions enable row level security;
alter table interviews enable row level security;
alter table interview_scorecard_items enable row level security;
alter table profiles enable row level security;

create policy "authenticated_all_interview_types" on interview_types
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_trainers" on trainers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_students" on students
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_questions" on questions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_interviews" on interviews
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_scorecard_items" on interview_scorecard_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_all_profiles" on profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Auto-create a profile row when a new auth user signs up (defaults to admin_interviewer;
-- update the role manually in the table editor as needed).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin_interviewer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

begin;

alter table public.session_runs
  add column if not exists current_set integer not null default 1 check (current_set between 1 and 20);

create table if not exists public.session_set_logs (
  id uuid primary key default gen_random_uuid(),
  session_run_id uuid not null references public.session_runs(id) on delete cascade,
  planned_session_exercise_id uuid not null references public.planned_session_exercises(id) on delete cascade,
  set_number integer not null check (set_number between 1 and 20),
  status text not null default 'completed' check (status in ('completed', 'skipped')),
  reps_completed integer check (reps_completed between 0 and 500),
  rpe numeric(3,1) check (rpe between 1 and 10),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_run_id, planned_session_exercise_id, set_number),
  check ((status = 'completed' and reps_completed is not null) or status = 'skipped')
);

create index if not exists session_set_logs_run_idx on public.session_set_logs(session_run_id, completed_at);
drop trigger if exists session_set_logs_updated on public.session_set_logs;
create trigger session_set_logs_updated before update on public.session_set_logs
for each row execute function public.set_updated_at();

alter table public.session_set_logs enable row level security;
drop policy if exists session_set_logs_own on public.session_set_logs;
create policy session_set_logs_own on public.session_set_logs for all to authenticated
using (exists(select 1 from public.session_runs r where r.id = session_run_id and r.profile_id = (select auth.uid())))
with check (exists(select 1 from public.session_runs r where r.id = session_run_id and r.profile_id = (select auth.uid())));

grant select,insert,update,delete on public.session_set_logs to authenticated;

commit;

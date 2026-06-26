begin;

drop table if exists public.recommendation_audits cascade;
drop table if exists public.coach_messages cascade;
drop table if exists public.coach_conversations cascade;
drop table if exists public.meal_logs cascade;
drop table if exists public.meal_plan_items cascade;
drop table if exists public.meal_plans cascade;
drop table if exists public.recipe_ingredients cascade;
drop table if exists public.recipes cascade;
drop table if exists public.foods cascade;
drop table if exists public.nutrition_profiles cascade;
drop table if exists public.session_runs cascade;
drop table if exists public.planned_session_exercises cascade;
drop table if exists public.planned_sessions cascade;
drop table if exists public.weekly_plans cascade;
drop table if exists public.weekly_checkins cascade;
drop table if exists public.daily_checkins cascade;
drop table if exists public.workout_exercises cascade;
drop table if exists public.workouts cascade;
drop table if exists public.habits cascade;
drop table if exists public.body_metrics cascade;
drop table if exists public.exercise_catalog cascade;
drop table if exists public.training_profiles cascade;
drop table if exists public.profiles cascade;

drop type if exists public.meal_status cascade;
drop type if exists public.meal_slot cascade;
drop type if exists public.diet_pattern cascade;
drop type if exists public.session_status cascade;
drop type if exists public.recommendation_status cascade;
drop type if exists public.plan_adjustment cascade;
drop type if exists public.activity_level cascade;
drop type if exists public.experience_level cascade;
drop type if exists public.activity_type cascade;
drop type if exists public.goal_type cascade;
drop type if exists public.profile_sex cascade;

create type public.goal_type as enum ('body_recomposition', 'fat_loss', 'muscle_gain', 'fitness');
create type public.profile_sex as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type public.activity_type as enum ('strength', 'walking', 'running', 'cycling', 'sport', 'mobility', 'other');
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.activity_level as enum ('inactive', 'light', 'regular', 'very_active');
create type public.plan_adjustment as enum ('baseline', 'progress', 'maintain', 'recovery', 'paused');
create type public.recommendation_status as enum ('normal', 'reduced', 'paused');
create type public.session_status as enum ('active', 'paused', 'completed', 'abandoned');
create type public.diet_pattern as enum ('omnivore', 'vegetarian', 'vegan');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.meal_status as enum ('planned', 'completed', 'skipped', 'substituted');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  birth_date date not null check (birth_date <= current_date - interval '18 years'),
  sex public.profile_sex,
  height_cm numeric(5,2) not null check (height_cm between 100 and 250),
  goal public.goal_type not null,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 80),
  terms_accepted_at timestamptz not null,
  safety_notice_accepted_at timestamptz not null,
  onboarding_completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  experience public.experience_level not null,
  current_activity public.activity_level not null,
  available_days integer not null check (available_days between 2 and 6),
  session_minutes integer not null check (session_minutes between 15 and 120),
  equipment text[] not null check (cardinality(equipment) > 0),
  limitations text check (limitations is null or char_length(limitations) <= 1000),
  current_pain boolean not null default false,
  has_medical_condition boolean not null default false,
  professional_clearance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  diet_pattern public.diet_pattern not null default 'omnivore',
  allergies text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  meals_per_day integer not null default 3 check (meals_per_day between 3 and 4),
  cooking_minutes integer not null default 30 check (cooking_minutes between 10 and 120),
  energy_calculation_sex public.profile_sex,
  energy_target_min integer check (energy_target_min between 1000 and 6000),
  energy_target_max integer check (energy_target_max between 1000 and 6500),
  protein_target_min integer check (protein_target_min between 30 and 400),
  protein_target_max integer check (protein_target_max between 30 and 450),
  target_confirmed_at timestamptz,
  pregnancy_or_lactation boolean not null default false,
  eating_disorder boolean not null default false,
  renal_or_metabolic_condition boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (energy_target_min is null or energy_target_max is null or energy_target_min <= energy_target_max),
  check (protein_target_min is null or protein_target_max is null or protein_target_min <= protein_target_max)
);

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  recorded_on date not null,
  weight_kg numeric(5,2) check (weight_kg between 30 and 350),
  height_cm numeric(5,2) check (height_cm between 100 and 250),
  waist_cm numeric(5,2) check (waist_cm between 30 and 250),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, recorded_on),
  check (num_nonnulls(weight_kg, height_cm, waist_cm) > 0)
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  recorded_on date not null,
  water_l numeric(4,2) not null default 0 check (water_l between 0 and 15),
  sleep_hours numeric(4,2) not null default 0 check (sleep_hours between 0 and 24),
  steps integer not null default 0 check (steps between 0 and 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, recorded_on)
);

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  recorded_on date not null,
  energy integer not null check (energy between 1 and 5),
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  stress integer not null check (stress between 1 and 5),
  soreness integer not null check (soreness between 1 and 5),
  readiness integer not null check (readiness between 1 and 5),
  pain boolean not null default false,
  dizziness boolean not null default false,
  chest_pain boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, recorded_on)
);

create table public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  energy integer not null check (energy between 1 and 5),
  recovery integer not null check (recovery between 1 and 5),
  soreness integer not null check (soreness between 1 and 5),
  pain boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, week_start)
);

create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  movement text not null,
  level public.experience_level not null,
  equipment text[] not null,
  goals public.goal_type[] not null,
  instructions text[] not null,
  cues text[] not null,
  common_mistakes text[] not null,
  illustration_key text not null,
  video_url text not null,
  video_source text not null,
  source_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  adjustment public.plan_adjustment not null,
  rationale text not null check (char_length(rationale) between 10 and 1500),
  source_keys text[] not null,
  created_at timestamptz not null default now(),
  unique (profile_id, week_start)
);

create table public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  day_index integer not null check (day_index between 1 and 7),
  title text not null,
  focus text not null,
  duration_minutes integer not null check (duration_minutes between 10 and 180),
  target_rpe numeric(3,1) not null check (target_rpe between 1 and 10),
  unique (plan_id, day_index)
);

create table public.planned_session_exercises (
  id uuid primary key default gen_random_uuid(),
  planned_session_id uuid not null references public.planned_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog(id),
  position integer not null check (position between 0 and 30),
  sets integer not null check (sets between 1 and 20),
  reps_min integer not null check (reps_min between 1 and 100),
  reps_max integer not null check (reps_max between reps_min and 200),
  rest_seconds integer not null check (rest_seconds between 15 and 600),
  note text check (note is null or char_length(note) <= 300),
  unique (planned_session_id, position)
);

create table public.session_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  planned_session_id uuid references public.planned_sessions(id) on delete set null,
  status public.session_status not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  elapsed_seconds integer not null default 0 check (elapsed_seconds between 0 and 86400),
  current_exercise integer not null default 0 check (current_exercise between 0 and 30),
  phase text not null default 'exercise' check (phase in ('exercise', 'rest')),
  phase_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_run_id uuid unique references public.session_runs(id) on delete set null,
  planned_session_id uuid references public.planned_sessions(id) on delete set null,
  performed_on date not null,
  activity_type public.activity_type not null,
  title text not null check (char_length(trim(title)) between 2 and 120),
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  intensity_rpe numeric(3,1) check (intensity_rpe between 1 and 10),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercise_catalog(id) on delete set null,
  exercise_name text not null,
  sets integer check (sets between 1 and 30),
  reps integer check (reps between 1 and 500),
  rpe numeric(3,1) check (rpe between 1 and 10),
  position integer not null,
  created_at timestamptz not null default now()
);

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null,
  calories_per_unit numeric(8,2) not null check (calories_per_unit >= 0),
  protein_g_per_unit numeric(8,2) not null check (protein_g_per_unit >= 0),
  source_name text not null,
  source_ref text not null,
  allergens text[] not null default '{}'
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  slot public.meal_slot not null,
  diet_patterns public.diet_pattern[] not null,
  cuisine text not null check (cuisine in ('mexican', 'international')),
  instructions text[] not null,
  prep_minutes integer not null check (prep_minutes between 5 and 120),
  calories integer not null check (calories between 100 and 1500),
  protein_g integer not null check (protein_g between 1 and 150),
  allergens text[] not null default '{}',
  active boolean not null default true,
  source_note text not null
);

create table public.recipe_ingredients (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_id uuid not null references public.foods(id),
  quantity numeric(8,2) not null check (quantity > 0),
  display_quantity text not null,
  primary key (recipe_id, food_id)
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  energy_target_min integer not null,
  energy_target_max integer not null,
  protein_target_min integer not null,
  protein_target_max integer not null,
  source_keys text[] not null,
  created_at timestamptz not null default now(),
  unique (profile_id, week_start)
);

create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  planned_on date not null,
  slot public.meal_slot not null,
  recipe_id uuid not null references public.recipes(id),
  servings numeric(4,2) not null default 1 check (servings between 0.5 and 4),
  unique (meal_plan_id, planned_on, slot)
);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  meal_plan_item_id uuid not null references public.meal_plan_items(id) on delete cascade,
  status public.meal_status not null,
  note text check (note is null or char_length(note) <= 300),
  logged_at timestamptz not null default now(),
  unique (profile_id, meal_plan_item_id)
);

create table public.coach_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Conversación con GLM',
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.coach_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  context_type text check (context_type in ('general', 'daily', 'session', 'exercise', 'meal')),
  created_at timestamptz not null default now()
);

create table public.recommendation_audits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  recommendation_date date not null,
  status public.recommendation_status not null,
  rule_version text not null,
  inputs jsonb not null,
  rationale text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, recommendation_date)
);

create index body_metrics_profile_date_idx on public.body_metrics(profile_id, recorded_on desc);
create index daily_checkins_profile_date_idx on public.daily_checkins(profile_id, recorded_on desc);
create index workouts_profile_date_idx on public.workouts(profile_id, performed_on desc);
create index weekly_plans_profile_week_idx on public.weekly_plans(profile_id, week_start desc);
create index meal_plans_profile_week_idx on public.meal_plans(profile_id, week_start desc);
create index coach_conversations_expiry_idx on public.coach_conversations(expires_at);

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger training_profiles_updated before update on public.training_profiles for each row execute function public.set_updated_at();
create trigger nutrition_profiles_updated before update on public.nutrition_profiles for each row execute function public.set_updated_at();
create trigger body_metrics_updated before update on public.body_metrics for each row execute function public.set_updated_at();
create trigger habits_updated before update on public.habits for each row execute function public.set_updated_at();
create trigger daily_checkins_updated before update on public.daily_checkins for each row execute function public.set_updated_at();
create trigger weekly_checkins_updated before update on public.weekly_checkins for each row execute function public.set_updated_at();
create trigger session_runs_updated before update on public.session_runs for each row execute function public.set_updated_at();
create trigger workouts_updated before update on public.workouts for each row execute function public.set_updated_at();
create trigger coach_conversations_updated before update on public.coach_conversations for each row execute function public.set_updated_at();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'training_profiles','nutrition_profiles','body_metrics','habits','daily_checkins','weekly_checkins',
    'weekly_plans','planned_sessions','planned_session_exercises','session_runs','workouts','workout_exercises',
    'meal_plans','meal_plan_items','meal_logs','coach_conversations','coach_messages','recommendation_audits'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;
alter table public.profiles enable row level security;
alter table public.exercise_catalog enable row level security;
alter table public.foods enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;

create policy catalog_read on public.exercise_catalog for select to authenticated using (active);
create policy foods_read on public.foods for select to authenticated using (true);
create policy recipes_read on public.recipes for select to authenticated using (active);
create policy recipe_ingredients_read on public.recipe_ingredients for select to authenticated using (true);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'training_profiles','nutrition_profiles','body_metrics','habits','daily_checkins','weekly_checkins',
    'weekly_plans','session_runs','workouts','meal_plans','meal_logs','coach_conversations','recommendation_audits'
  ] loop
    execute format('create policy %I_select on public.%I for select to authenticated using (profile_id = (select auth.uid()))', table_name, table_name);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (profile_id = (select auth.uid()))', table_name, table_name);
    execute format('create policy %I_update on public.%I for update to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()))', table_name, table_name);
    execute format('create policy %I_delete on public.%I for delete to authenticated using (profile_id = (select auth.uid()))', table_name, table_name);
  end loop;
end $$;

-- profiles uses id rather than profile_id.
create policy profiles_select on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_delete on public.profiles for delete to authenticated using (id = (select auth.uid()));

create policy planned_sessions_own on public.planned_sessions for all to authenticated
using (exists(select 1 from public.weekly_plans p where p.id = plan_id and p.profile_id = (select auth.uid())))
with check (exists(select 1 from public.weekly_plans p where p.id = plan_id and p.profile_id = (select auth.uid())));
create policy planned_exercises_own on public.planned_session_exercises for all to authenticated
using (exists(select 1 from public.planned_sessions s join public.weekly_plans p on p.id=s.plan_id where s.id=planned_session_id and p.profile_id=(select auth.uid())))
with check (exists(select 1 from public.planned_sessions s join public.weekly_plans p on p.id=s.plan_id where s.id=planned_session_id and p.profile_id=(select auth.uid())));
create policy workout_exercises_own on public.workout_exercises for all to authenticated
using (exists(select 1 from public.workouts w where w.id=workout_id and w.profile_id=(select auth.uid())))
with check (exists(select 1 from public.workouts w where w.id=workout_id and w.profile_id=(select auth.uid())));
create policy meal_items_own on public.meal_plan_items for all to authenticated
using (exists(select 1 from public.meal_plans p where p.id=meal_plan_id and p.profile_id=(select auth.uid())))
with check (exists(select 1 from public.meal_plans p where p.id=meal_plan_id and p.profile_id=(select auth.uid())));
create policy coach_messages_own on public.coach_messages for all to authenticated
using (exists(select 1 from public.coach_conversations c where c.id=conversation_id and c.profile_id=(select auth.uid())))
with check (exists(select 1 from public.coach_conversations c where c.id=conversation_id and c.profile_id=(select auth.uid())));

create or replace function public.complete_onboarding_v2(p_profile jsonb, p_training jsonb, p_nutrition jsonb, p_weight numeric, p_local_date date)
returns uuid language plpgsql security invoker as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required'; end if;
  insert into public.profiles(id,name,birth_date,sex,height_cm,goal,timezone,terms_accepted_at,safety_notice_accepted_at)
  values(uid,trim(p_profile->>'name'),(p_profile->>'birth_date')::date,nullif(p_profile->>'sex','')::public.profile_sex,
    (p_profile->>'height_cm')::numeric,(p_profile->>'goal')::public.goal_type,p_profile->>'timezone',now(),now());
  insert into public.training_profiles(profile_id,experience,current_activity,available_days,session_minutes,equipment,limitations,current_pain,has_medical_condition,professional_clearance)
  values(uid,(p_training->>'experience')::public.experience_level,(p_training->>'current_activity')::public.activity_level,
    (p_training->>'available_days')::integer,(p_training->>'session_minutes')::integer,
    array(select jsonb_array_elements_text(p_training->'equipment')),nullif(trim(p_training->>'limitations'),''),false,
    coalesce((p_training->>'has_medical_condition')::boolean,false),coalesce((p_training->>'professional_clearance')::boolean,false));
  insert into public.nutrition_profiles(profile_id,diet_pattern,allergies,disliked_foods,meals_per_day,cooking_minutes,energy_calculation_sex,pregnancy_or_lactation,eating_disorder,renal_or_metabolic_condition)
  values(uid,(p_nutrition->>'diet_pattern')::public.diet_pattern,array(select jsonb_array_elements_text(p_nutrition->'allergies')),
    array(select jsonb_array_elements_text(p_nutrition->'disliked_foods')),(p_nutrition->>'meals_per_day')::integer,
    (p_nutrition->>'cooking_minutes')::integer,nullif(p_nutrition->>'energy_calculation_sex','')::public.profile_sex,
    coalesce((p_nutrition->>'pregnancy_or_lactation')::boolean,false),coalesce((p_nutrition->>'eating_disorder')::boolean,false),
    coalesce((p_nutrition->>'renal_or_metabolic_condition')::boolean,false));
  insert into public.body_metrics(profile_id,recorded_on,weight_kg,height_cm)
  values(uid,p_local_date,p_weight,(p_profile->>'height_cm')::numeric);
  return uid;
end $$;

create or replace function public.replace_weekly_plan_v2(p_week_start date,p_adjustment public.plan_adjustment,p_rationale text,p_source_keys text[],p_sessions jsonb)
returns uuid language plpgsql security invoker as $$
declare uid uuid:=auth.uid(); plan_uuid uuid; session_row jsonb; exercise_row jsonb; session_uuid uuid;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  delete from public.weekly_plans where profile_id=uid and week_start=p_week_start;
  insert into public.weekly_plans(profile_id,week_start,adjustment,rationale,source_keys)
  values(uid,p_week_start,p_adjustment,p_rationale,p_source_keys) returning id into plan_uuid;
  for session_row in select * from jsonb_array_elements(p_sessions) loop
    insert into public.planned_sessions(plan_id,day_index,title,focus,duration_minutes,target_rpe)
    values(plan_uuid,(session_row->>'day_index')::integer,session_row->>'title',session_row->>'focus',(session_row->>'duration_minutes')::integer,(session_row->>'target_rpe')::numeric)
    returning id into session_uuid;
    for exercise_row in select * from jsonb_array_elements(session_row->'exercises') loop
      insert into public.planned_session_exercises(planned_session_id,exercise_id,position,sets,reps_min,reps_max,rest_seconds,note)
      values(session_uuid,(exercise_row->>'exercise_id')::uuid,(exercise_row->>'position')::integer,(exercise_row->>'sets')::integer,
        (exercise_row->>'reps_min')::integer,(exercise_row->>'reps_max')::integer,(exercise_row->>'rest_seconds')::integer,nullif(exercise_row->>'note',''));
    end loop;
  end loop;
  return plan_uuid;
end $$;

create or replace function public.purge_expired_coach_conversations()
returns integer language plpgsql security definer set search_path=public as $$
declare deleted_count integer;
begin
  delete from public.coach_conversations where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end $$;

revoke all on all tables in schema public from anon;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant execute on function public.complete_onboarding_v2(jsonb,jsonb,jsonb,numeric,date) to authenticated;
grant execute on function public.replace_weekly_plan_v2(date,public.plan_adjustment,text,text[],jsonb) to authenticated;
revoke all on function public.purge_expired_coach_conversations() from public,anon,authenticated;

insert into public.exercise_catalog(slug,name,movement,level,equipment,goals,instructions,cues,common_mistakes,illustration_key,video_url,video_source,source_url)
select slug,name,movement,level::public.experience_level,equipment,goals::public.goal_type[],instructions,cues,common_mistakes,illustration_key,video_url,video_source,source_url
from (values
('chair-squat','Sentadilla a silla','squat','beginner',array['none'],array['body_recomposition','fat_loss','muscle_gain','fitness'],array['Coloca una silla estable detrás de ti.','Lleva la cadera atrás y flexiona las rodillas.','Toca la silla con control y vuelve a levantarte.'],array['Rodillas siguen la dirección de los pies','Mantén todo el pie apoyado'],array['Dejarse caer','Juntar las rodillas'],'squat','https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('bodyweight-squat','Sentadilla con peso corporal','squat','intermediate',array['none'],array['body_recomposition','fat_loss','muscle_gain','fitness'],array['Separa los pies al ancho cómodo.','Desciende llevando la cadera atrás.','Sube empujando el suelo sin perder postura.'],array['Pecho estable','Movimiento sin dolor'],array['Elevar talones','Perder control lumbar'],'squat','https://www.acefitness.org/resources/everyone/exercise-library/135/bodyweight-squat/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('incline-pushup','Flexión inclinada','push','beginner',array['none'],array['body_recomposition','muscle_gain','fitness'],array['Apoya las manos en una superficie firme.','Forma una línea recta de cabeza a talones.','Acerca el pecho y empuja con control.'],array['Codos a unos 45 grados','Abdomen firme'],array['Hundir la cadera','Abrir demasiado los codos'],'pushup','https://www.acefitness.org/resources/everyone/exercise-library/41/incline-push-ups/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('pushup','Flexión','push','intermediate',array['none'],array['body_recomposition','muscle_gain','fitness'],array['Coloca manos bajo los hombros.','Desciende como una sola unidad.','Empuja el suelo hasta extender los brazos.'],array['Cuello neutral','Glúteos y abdomen activos'],array['Cadera caída','Rebote en el fondo'],'pushup','https://www.acefitness.org/resources/everyone/exercise-library/41/incline-push-ups/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('band-row','Remo con banda','pull','beginner',array['bands'],array['body_recomposition','muscle_gain','fitness'],array['Ancla la banda de forma segura.','Lleva los codos hacia atrás.','Regresa lentamente sin soltar tensión.'],array['Hombros lejos de orejas','Torso quieto'],array['Encoger hombros','Impulsarse con el cuerpo'],'row','https://www.acefitness.org/resources/everyone/exercise-library/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('dumbbell-row','Remo con mancuerna','pull','intermediate',array['dumbbells','gym'],array['body_recomposition','muscle_gain','fitness'],array['Apoya una mano en superficie estable.','Lleva la mancuerna hacia la cadera.','Baja con control completo.'],array['Espalda neutral','Codo cerca del cuerpo'],array['Girar el torso','Jalar hacia el hombro'],'row','https://www.acefitness.org/resources/everyone/exercise-library/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('glute-bridge','Puente de glúteos','hinge','beginner',array['none'],array['body_recomposition','muscle_gain','fitness'],array['Acuéstate con rodillas flexionadas.','Eleva la cadera apretando glúteos.','Baja lentamente sin arquear la espalda.'],array['Costillas contenidas','Empuja con talones'],array['Hiperextender espalda','Separar demasiado los pies'],'bridge','https://www.acefitness.org/resources/everyone/exercise-library/49/glute-bridge/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('dead-bug','Dead bug','core','beginner',array['none'],array['body_recomposition','fitness'],array['Acuéstate y eleva brazos y piernas.','Extiende brazo y pierna contrarios.','Regresa y alterna manteniendo la espalda estable.'],array['Respira con control','Reduce rango si se arquea la espalda'],array['Moverse rápido','Separar zona lumbar'],'core','https://www.acefitness.org/resources/everyone/exercise-library/147/supine-dead-bug/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('front-plank','Plancha frontal','core','intermediate',array['none'],array['body_recomposition','fitness'],array['Apoya antebrazos y puntas de pies.','Alinea cabeza, tronco y cadera.','Mantén respiración tranquila durante el tiempo indicado.'],array['Aprieta glúteos','Empuja el suelo'],array['Cadera muy alta','Contener la respiración'],'plank','https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/','ACE','https://www.acefitness.org/resources/everyone/exercise-library/'),
('brisk-walk','Caminata a paso cómodo','cardio','beginner',array['none'],array['body_recomposition','fat_loss','fitness'],array['Inicia cinco minutos a ritmo suave.','Aumenta a un ritmo donde aún puedas conversar.','Termina reduciendo el ritmo gradualmente.'],array['Pasos naturales','Postura relajada'],array['Empezar demasiado rápido','Ignorar dolor o mareo'],'walk','https://www.nhs.uk/live-well/exercise/walking-for-health/','NHS','https://www.nhs.uk/live-well/exercise/walking-for-health/')
) as seed(slug,name,movement,level,equipment,goals,instructions,cues,common_mistakes,illustration_key,video_url,video_source,source_url);

insert into public.foods(name,unit,calories_per_unit,protein_g_per_unit,source_name,source_ref,allergens) values
('Avena','40 g',152,5.1,'USDA FoodData Central','FDC oats','{}'),('Yogur griego','170 g',120,17,'USDA FoodData Central','FDC yogurt',array['dairy']),
('Frutos rojos','100 g',57,0.7,'USDA FoodData Central','FDC berries','{}'),('Huevo','1 pieza',72,6.3,'USDA FoodData Central','FDC egg',array['egg']),
('Tortilla de maíz','1 pieza',58,1.4,'USDA FoodData Central','FDC tortilla','{}'),('Frijoles cocidos','150 g',191,12,'USDA FoodData Central','FDC beans','{}'),
('Pechuga de pollo','150 g',248,46,'USDA FoodData Central','FDC chicken','{}'),('Arroz cocido','150 g',195,4,'USDA FoodData Central','FDC rice','{}'),
('Verduras mixtas','200 g',100,5,'USDA FoodData Central','FDC vegetables','{}'),('Salmón','150 g',312,33,'USDA FoodData Central','FDC salmon',array['fish']),
('Tofu','150 g',216,26,'USDA FoodData Central','FDC tofu',array['soy']),('Lentejas cocidas','180 g',209,16,'USDA FoodData Central','FDC lentils','{}'),
('Pan integral','2 rebanadas',160,8,'USDA FoodData Central','FDC bread',array['gluten']),('Aguacate','100 g',160,2,'USDA FoodData Central','FDC avocado','{}'),
('Plátano','1 pieza',105,1.3,'USDA FoodData Central','FDC banana','{}'),('Nueces','30 g',196,4.6,'USDA FoodData Central','FDC walnuts',array['nuts']);

insert into public.recipes(slug,name,slot,diet_patterns,cuisine,instructions,prep_minutes,calories,protein_g,allergens,source_note)
select slug,name,slot::public.meal_slot,diet_patterns::public.diet_pattern[],cuisine,instructions,prep_minutes,calories,protein_g,allergens,source_note
from (values
('avena-yogur','Avena con yogur y frutos rojos','breakfast',array['omnivore','vegetarian'],'international',array['Mezcla la avena con el yogur.','Añade frutos rojos y agua o canela al gusto.'],10,329,23,array['dairy'],'Porciones calculadas con USDA FoodData Central.'),
('avena-platano','Avena con plátano','breakfast',array['omnivore','vegetarian','vegan'],'mexican',array['Cuece la avena con agua.','Sirve con plátano rebanado y canela.'],12,257,7,'{}','Porciones calculadas con USDA FoodData Central.'),
('huevos-frijoles','Huevos con frijoles y tortillas','breakfast',array['omnivore','vegetarian'],'mexican',array['Cocina los huevos sin exceso de aceite.','Sirve con frijoles y tortillas calientes.'],15,423,25,array['egg'],'Estructura basada en Plato del Bien Comer; nutrientes USDA.'),
('tostada-aguacate','Pan integral con aguacate y huevo','breakfast',array['omnivore','vegetarian'],'international',array['Tuesta el pan.','Agrega aguacate machacado y huevo cocido.'],12,392,16,array['gluten','egg'],'Porciones calculadas con USDA FoodData Central.'),
('bowl-pollo','Bowl de pollo, arroz y verduras','lunch',array['omnivore'],'international',array['Cocina el pollo completamente.','Sirve sobre arroz con verduras salteadas.'],30,543,55,'{}','Porciones calculadas con USDA FoodData Central.'),
('tacos-pollo','Tacos de pollo con frijoles','lunch',array['omnivore'],'mexican',array['Calienta pollo y frijoles.','Sirve en tortillas con verduras frescas.'],25,521,54,'{}','Estructura basada en Plato del Bien Comer; nutrientes USDA.'),
('bowl-tofu','Bowl de tofu, arroz y verduras','lunch',array['vegetarian','vegan'],'international',array['Dora el tofu en sartén.','Sirve con arroz y verduras.'],25,511,35,array['soy'],'Porciones calculadas con USDA FoodData Central.'),
('lentejas-mexicanas','Lentejas con verduras y tortillas','lunch',array['omnivore','vegetarian','vegan'],'mexican',array['Cuece lentejas con tomate, cebolla y especias.','Sirve con tortillas y verduras.'],35,483,23,'{}','Estructura basada en Plato del Bien Comer; nutrientes USDA.'),
('salmon-arroz','Salmón con arroz y verduras','dinner',array['omnivore'],'international',array['Cocina el salmón hasta temperatura segura.','Acompaña con arroz y verduras.'],30,607,42,array['fish'],'Porciones calculadas con USDA FoodData Central.'),
('ensalada-pollo','Ensalada completa de pollo y aguacate','dinner',array['omnivore'],'mexican',array['Combina verduras lavadas con pollo cocido.','Añade aguacate y limón.'],20,508,53,'{}','Estructura basada en Plato del Bien Comer; nutrientes USDA.'),
('tofu-verduras','Tofu con verduras y tortillas','dinner',array['vegetarian','vegan'],'mexican',array['Saltea tofu y verduras con poco aceite.','Sirve con tortillas.'],25,432,32,array['soy'],'Estructura basada en Plato del Bien Comer; nutrientes USDA.'),
('lentejas-arroz','Lentejas con arroz y verduras','dinner',array['omnivore','vegetarian','vegan'],'international',array['Calienta lentejas y arroz.','Integra verduras y sazona moderadamente.'],25,504,25,'{}','Porciones calculadas con USDA FoodData Central.'),
('yogur-fruta','Yogur griego con fruta','snack',array['omnivore','vegetarian'],'international',array['Sirve el yogur frío.','Añade fruta fresca.'],5,177,18,array['dairy'],'Porciones calculadas con USDA FoodData Central.'),
('platano-simple','Plátano fresco','snack',array['omnivore','vegetarian','vegan'],'mexican',array['Lava tus manos, pela el plátano y sírvelo.'],5,105,1,'{}','Porción calculada con USDA FoodData Central.'),
('platano-nueces','Plátano con nueces','snack',array['omnivore','vegetarian','vegan'],'international',array['Sirve el plátano con las nueces medidas.'],5,301,6,array['nuts'],'Porciones calculadas con USDA FoodData Central.')
) as seed(slug,name,slot,diet_patterns,cuisine,instructions,prep_minutes,calories,protein_g,allergens,source_note);

-- Ingredient links support grocery aggregation without live third-party calls.
insert into public.recipe_ingredients(recipe_id,food_id,quantity,display_quantity)
select r.id,f.id,x.quantity,x.display_quantity from (values
('avena-yogur','Avena',1::numeric,'40 g'),('avena-yogur','Yogur griego',1,'170 g'),('avena-yogur','Frutos rojos',1,'100 g'),
('avena-platano','Avena',1,'40 g'),('avena-platano','Plátano',1,'1 pieza'),
('huevos-frijoles','Huevo',2,'2 piezas'),('huevos-frijoles','Frijoles cocidos',1,'150 g'),('huevos-frijoles','Tortilla de maíz',2,'2 piezas'),
('bowl-pollo','Pechuga de pollo',1,'150 g'),('bowl-pollo','Arroz cocido',1,'150 g'),('bowl-pollo','Verduras mixtas',1,'200 g'),
('tacos-pollo','Pechuga de pollo',1,'150 g'),('tacos-pollo','Frijoles cocidos',1,'150 g'),('tacos-pollo','Tortilla de maíz',2,'2 piezas'),
('bowl-tofu','Tofu',1,'150 g'),('bowl-tofu','Arroz cocido',1,'150 g'),('bowl-tofu','Verduras mixtas',1,'200 g'),
('lentejas-mexicanas','Lentejas cocidas',1,'180 g'),('lentejas-mexicanas','Verduras mixtas',1,'200 g'),('lentejas-mexicanas','Tortilla de maíz',2,'2 piezas'),
('salmon-arroz','Salmón',1,'150 g'),('salmon-arroz','Arroz cocido',1,'150 g'),('salmon-arroz','Verduras mixtas',1,'200 g'),
('tofu-verduras','Tofu',1,'150 g'),('tofu-verduras','Verduras mixtas',1,'200 g'),('tofu-verduras','Tortilla de maíz',2,'2 piezas'),
('lentejas-arroz','Lentejas cocidas',1,'180 g'),('lentejas-arroz','Arroz cocido',1,'150 g'),('lentejas-arroz','Verduras mixtas',1,'200 g'),
('yogur-fruta','Yogur griego',1,'170 g'),('yogur-fruta','Frutos rojos',1,'100 g'),('platano-simple','Plátano',1,'1 pieza'),('platano-nueces','Plátano',1,'1 pieza'),('platano-nueces','Nueces',1,'30 g')
) as x(recipe_slug,food_name,quantity,display_quantity)
join public.recipes r on r.slug=x.recipe_slug join public.foods f on f.name=x.food_name;

commit;

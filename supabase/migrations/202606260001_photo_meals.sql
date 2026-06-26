-- Add manual photo meal logging without changing weekly meal plans.

do $$
begin
  create type public.photo_meal_status as enum ('pending', 'consumed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.photo_meal_analysis_status as enum ('not_analyzed', 'analyzing', 'needs_review', 'reviewed', 'failed');
exception
  when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_path text not null,
  title text not null default 'Platillo pendiente' check (char_length(title) between 2 and 120),
  status public.photo_meal_status not null default 'pending',
  calories_estimated numeric(8,2) check (calories_estimated is null or calories_estimated between 0 and 5000),
  protein_estimated numeric(8,2) check (protein_estimated is null or protein_estimated between 0 and 500),
  carbs_estimated numeric(8,2) check (carbs_estimated is null or carbs_estimated between 0 and 800),
  fat_estimated numeric(8,2) check (fat_estimated is null or fat_estimated between 0 and 500),
  analysis_status public.photo_meal_analysis_status not null default 'not_analyzed',
  detected_items jsonb not null default '[]'::jsonb,
  analysis_questions jsonb not null default '[]'::jsonb,
  quantity_notes text check (quantity_notes is null or char_length(quantity_notes) <= 2000),
  analysis_error text check (analysis_error is null or char_length(analysis_error) <= 500),
  analysis_model text check (analysis_model is null or char_length(analysis_model) <= 100),
  analysis_completed_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and consumed_at is null)
    or (status = 'consumed' and consumed_at is not null)
  ),
  check (jsonb_typeof(detected_items) = 'array'),
  check (jsonb_typeof(analysis_questions) = 'array')
);

create index if not exists meals_profile_created_idx on public.meals(profile_id, created_at desc);
create index if not exists meals_profile_status_idx on public.meals(profile_id, status, created_at desc);

drop trigger if exists meals_updated on public.meals;
create trigger meals_updated before update on public.meals for each row execute function public.set_updated_at();

alter table public.meals enable row level security;

drop policy if exists meals_select on public.meals;
drop policy if exists meals_insert on public.meals;
drop policy if exists meals_update on public.meals;
drop policy if exists meals_delete on public.meals;

create policy meals_select on public.meals for select to authenticated
using (profile_id = (select auth.uid()));

create policy meals_insert on public.meals for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy meals_update on public.meals for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy meals_delete on public.meals for delete to authenticated
using (profile_id = (select auth.uid()));

grant select, insert, update, delete on public.meals to authenticated;

drop policy if exists meal_photos_select on storage.objects;
drop policy if exists meal_photos_insert on storage.objects;
drop policy if exists meal_photos_update on storage.objects;
drop policy if exists meal_photos_delete on storage.objects;

create policy meal_photos_select on storage.objects for select to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy meal_photos_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy meal_photos_update on storage.objects for update to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy meal_photos_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

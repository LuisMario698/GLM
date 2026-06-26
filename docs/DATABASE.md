# Base de datos

La migración canónica es `supabase/migrations/202606240001_glm_v2.sql`.

## Dominios

- Identidad: `profiles`, `training_profiles`, `nutrition_profiles`.
- Registros reales: `body_metrics`, `habits`, `daily_checkins`, `weekly_checkins`, `workouts`.
- Entrenamiento: `exercise_catalog`, `weekly_plans`, `planned_sessions`, `planned_session_exercises`, `session_runs`, `session_set_logs`.
- Alimentación: `foods`, `recipes`, `recipe_ingredients`, `meal_plans`, `meal_plan_items`, `meal_logs`.
- Guía y trazabilidad: `coach_conversations`, `coach_messages`, `recommendation_audits`.

Todas las tablas personales usan RLS y `auth.uid()`. Los catálogos permiten sólo lectura a usuarios autenticados. `service_role` se limita a migración, pruebas y limpieza programada.

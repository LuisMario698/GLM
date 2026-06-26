'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireProfile, requireUser } from '@/lib/auth';
import { addDays, ageOn, localISODate, mondayOf } from '@/lib/date';
import { buildMealWeek } from '@/lib/nutrition/planner';
import { estimateNutrition } from '@/lib/nutrition/calculator';
import { recommendToday } from '@/lib/recommendations/daily';
import { generateWeeklyPlan as buildWeeklyPlan } from '@/lib/recommendations/weekly';
import { advanceCompletedSet, advanceSkippedExercise } from '@/lib/session/progress';
import { activitySchema, dailyCheckinSchema, metricSchema, nutritionSettingsSchema, onboardingSchema, trainingSettingsSchema, weeklyCheckinSchema } from '@/lib/validations';
import type { DailyCheckin, Exercise, NutritionProfile, Recipe, TrainingProfile, ActionResult } from '@/types/domain';
import { asResult, type FormState, validationState } from './state';

export async function completeOnboarding(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = onboardingSchema.safeParse({
    ...Object.fromEntries(formData),
    equipment: formData.getAll('equipment'),
  });
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const { supabase } = await requireUser();
  const d = parsed.data;
  const { error } = await supabase.rpc('complete_onboarding_v2', {
    p_profile: { name: d.name, birth_date: d.birth_date, sex: d.sex, height_cm: d.height_cm, goal: d.goal, timezone: d.timezone },
    p_training: { experience: d.experience, current_activity: d.current_activity, available_days: d.available_days, session_minutes: d.session_minutes, equipment: d.equipment, limitations: d.limitations, has_medical_condition: d.has_medical_condition, professional_clearance: d.professional_clearance },
    p_nutrition: { diet_pattern: d.diet_pattern, allergies: d.allergies, disliked_foods: d.disliked_foods, meals_per_day: d.meals_per_day, cooking_minutes: d.cooking_minutes, energy_calculation_sex: d.energy_calculation_sex, pregnancy_or_lactation: d.pregnancy_or_lactation, eating_disorder: d.eating_disorder, renal_or_metabolic_condition: d.renal_or_metabolic_condition },
    p_weight: d.weight_kg,
    p_local_date: d.local_date,
  });
  if (error) return { status: 'error', message: 'No fue posible crear tu perfil. Verifica que la migración V2 esté aplicada.' };
  redirect('/hoy');
}

export async function saveDailyCheckin(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = dailyCheckinSchema.safeParse({ ...Object.fromEntries(formData) });
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const { supabase, userId } = await requireUser();
  const checkin = { ...parsed.data, profile_id: userId, notes: parsed.data.notes || null };
  const recommendation = recommendToday(checkin as DailyCheckin);
  const [{ error }, audit] = await Promise.all([
    supabase.from('daily_checkins').upsert(checkin, { onConflict: 'profile_id,recorded_on' }),
    supabase.from('recommendation_audits').upsert({
      profile_id: userId, recommendation_date: parsed.data.recorded_on, status: recommendation.status,
      rule_version: 'daily-v1',
      inputs: { energy: parsed.data.energy, sleep_quality: parsed.data.sleep_quality, stress: parsed.data.stress, soreness: parsed.data.soreness, readiness: parsed.data.readiness, pain: parsed.data.pain, dizziness: parsed.data.dizziness, chest_pain: parsed.data.chest_pain },
      rationale: recommendation.rationale,
    }, { onConflict: 'profile_id,recommendation_date' }),
  ]);
  if (error || audit.error) return { status: 'error', message: 'No fue posible guardar cómo te sientes hoy.' };
  revalidatePath('/hoy');
  return { status: 'success', message: recommendation.title };
}

export async function generateWeeklyPlan(formData: FormData) {
  const requested = String(formData.get('week_start') ?? mondayOf(localISODate()));
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : mondayOf(localISODate());
  const { supabase, userId } = await requireUser();
  const previousWeek = addDays(weekStart, -7);
  const [{ data: training }, { data: exercises }, { data: checkin }, { data: previousPlan }, { data: workouts }] = await Promise.all([
    supabase.from('training_profiles').select('*').eq('profile_id', userId).single(),
    supabase.from('exercise_catalog').select('*').eq('active', true),
    supabase.from('weekly_checkins').select('*').eq('profile_id', userId).eq('week_start', previousWeek).maybeSingle(),
    supabase.from('weekly_plans').select('id').eq('profile_id', userId).eq('week_start', previousWeek).maybeSingle(),
    supabase.from('workouts').select('planned_session_id,intensity_rpe').eq('profile_id', userId).gte('performed_on', previousWeek).lte('performed_on', addDays(previousWeek, 6)),
  ]);
  if (!training) redirect('/ajustes');
  const { data: previousSessions } = previousPlan ? await supabase.from('planned_sessions').select('id').eq('plan_id', previousPlan.id) : { data: [] };
  const plannedIds = new Set((previousSessions ?? []).map((item) => item.id));
  const completed = new Set((workouts ?? []).map((item) => item.planned_session_id).filter((id): id is string => Boolean(id && plannedIds.has(id))));
  const rpes = (workouts ?? []).map((item) => item.intensity_rpe).filter((rpe): rpe is number => rpe !== null);
  const plan = buildWeeklyPlan({
    training: training as TrainingProfile,
    exercises: (exercises ?? []) as Exercise[],
    previousPlanned: previousSessions?.length ?? 0,
    previousCompleted: completed.size,
    averageRpe: rpes.length ? rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length : null,
    checkin,
  });
  const { error } = await supabase.rpc('replace_weekly_plan_v2', {
    p_week_start: weekStart, p_adjustment: plan.adjustment, p_rationale: plan.rationale,
    p_source_keys: plan.sourceKeys, p_sessions: plan.sessions,
  });
  if (error) throw new Error('No fue posible generar el plan semanal.');
  revalidatePath('/plan'); revalidatePath('/hoy');
  redirect('/plan');
}

export async function saveWeeklyCheckin(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = weeklyCheckinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from('weekly_checkins').upsert({ profile_id: userId, ...parsed.data, notes: parsed.data.notes || null }, { onConflict: 'profile_id,week_start' });
  if (error) return { status: 'error', message: 'No fue posible guardar la revisión semanal.' };
  revalidatePath('/plan');
  return { status: 'success', message: 'Revisión guardada. Ya puedes recalcular la semana.' };
}

export async function startSession(plannedSessionId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await requireUser();
    const { data: existing } = await supabase.from('session_runs').select('id').eq('profile_id', userId).eq('planned_session_id', plannedSessionId).in('status', ['active','paused']).order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (existing) return { ok: true, data: { id: existing.id } };
    const { data: session } = await supabase.from('planned_sessions').select('id,weekly_plans!inner(profile_id)').eq('id', plannedSessionId).single();
    if (!session) return { ok: false, error: 'La sesión no existe.' };
    const { data, error } = await supabase.from('session_runs').insert({ profile_id: userId, planned_session_id: plannedSessionId }).select('id').single();
    if (error) throw error;
    return { ok: true, data: { id: data.id } };
  } catch (error) { return asResult(error, 'No fue posible iniciar la sesión.'); }
}

export async function updateSessionTimer(input: { id: string; status: 'active' | 'paused'; elapsedSeconds: number; currentExercise: number; currentSet: number; phase: 'exercise' | 'rest'; phaseEndsAt: string | null }): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from('session_runs').update({ status: input.status, elapsed_seconds: input.elapsedSeconds, current_exercise: input.currentExercise, current_set: input.currentSet, phase: input.phase, phase_ends_at: input.phaseEndsAt }).eq('id', input.id).eq('profile_id', userId).neq('status', 'completed');
    if (error) throw error;
    return { ok: true, data: undefined };
  } catch (error) { return asResult(error, 'No fue posible guardar el temporizador.'); }
}

export type SetProgress = { nextExercise: number; nextSet: number; restSeconds: number; sessionComplete: boolean };

export async function completeSet(input: { runId:string; plannedExerciseId:string; setNumber:number; reps:number; rpe:number }): Promise<ActionResult<SetProgress>> {
  try {
    if (!Number.isInteger(input.setNumber) || input.setNumber < 1 || input.setNumber > 20 || !Number.isInteger(input.reps) || input.reps < 0 || input.reps > 500 || input.rpe < 1 || input.rpe > 10) return { ok:false,error:'Los datos de la serie no son válidos.' };
    const { supabase, userId } = await requireUser();
    const { data: run } = await supabase.from('session_runs').select('*').eq('id',input.runId).eq('profile_id',userId).in('status',['active','paused']).single();
    if (!run) return {ok:false,error:'La sesión no está activa.'};
    const { data: exercise } = await supabase.from('planned_session_exercises').select('*').eq('id',input.plannedExerciseId).eq('planned_session_id',run.planned_session_id).single();
    if (!exercise || input.setNumber > exercise.sets) return {ok:false,error:'La serie no pertenece a esta sesión.'};
    const { error } = await supabase.from('session_set_logs').upsert({session_run_id:run.id,planned_session_exercise_id:exercise.id,set_number:input.setNumber,status:'completed',reps_completed:input.reps,rpe:input.rpe},{onConflict:'session_run_id,planned_session_exercise_id,set_number'});
    if (error) throw error;
    const { data: allExercises } = await supabase.from('planned_session_exercises').select('id,position').eq('planned_session_id',run.planned_session_id).order('position');
    const { nextExercise, nextSet, sessionComplete } = advanceCompletedSet((allExercises ?? []).map((item) => item.id), exercise.id, input.setNumber, exercise.sets);
    const restSeconds=sessionComplete?0:exercise.rest_seconds; const phaseEndsAt=restSeconds?new Date(Date.now()+restSeconds*1000).toISOString():null;
    const { error: runError } = await supabase.from('session_runs').update({status:'active',current_exercise:Math.max(0,nextExercise),current_set:nextSet,phase:restSeconds?'rest':'exercise',phase_ends_at:phaseEndsAt}).eq('id',run.id);
    if (runError) throw runError;
    return {ok:true,data:{nextExercise,nextSet,restSeconds,sessionComplete}};
  } catch(error){return asResult(error,'No fue posible registrar la serie.');}
}

export async function updateSet(input:{logId:string;reps:number;rpe:number}):Promise<ActionResult>{
  try {
    if (!Number.isInteger(input.reps) || input.reps < 0 || input.reps > 500 || input.rpe < 1 || input.rpe > 10) {
      return { ok: false, error: 'Los datos no son válidos.' };
    }
    const { supabase, userId } = await requireUser();
    const { data: log } = await supabase.from('session_set_logs').select('id,session_run_id').eq('id', input.logId).single();
    if (!log) return { ok: false, error: 'Serie no encontrada.' };
    const { data: run } = await supabase.from('session_runs').select('id').eq('id', log.session_run_id).eq('profile_id', userId).single();
    if (!run) return { ok: false, error: 'Serie no encontrada.' };
    const { error } = await supabase.from('session_set_logs').update({ reps_completed: input.reps, rpe: input.rpe, status: 'completed' }).eq('id', input.logId);
    if (error) throw error;
    return { ok: true, data: undefined };
  } catch (error) {
    return asResult(error, 'No fue posible actualizar la serie.');
  }
}

export async function skipExercise(input: { runId: string; plannedExerciseId: string }): Promise<ActionResult<SetProgress>> {
  try {
    const { supabase, userId } = await requireUser();
    const { data: run } = await supabase.from('session_runs').select('*').eq('id', input.runId).eq('profile_id', userId).in('status', ['active', 'paused']).single();
    if (!run) return { ok: false, error: 'La sesión no está activa.' };
    const { data: exercise } = await supabase.from('planned_session_exercises').select('*').eq('id', input.plannedExerciseId).eq('planned_session_id', run.planned_session_id).single();
    if (!exercise) return { ok: false, error: 'Ejercicio no encontrado.' };
    const { error: logError } = await supabase.from('session_set_logs').upsert(Array.from({ length: exercise.sets }, (_, index) => ({ session_run_id: run.id, planned_session_exercise_id: exercise.id, set_number: index + 1, status: 'skipped', reps_completed: null, rpe: null })), { onConflict: 'session_run_id,planned_session_exercise_id,set_number' });
    if (logError) throw logError;
    const { data: all } = await supabase.from('planned_session_exercises').select('id,position').eq('planned_session_id', run.planned_session_id).order('position');
    const { nextExercise, sessionComplete } = advanceSkippedExercise((all ?? []).map((item) => item.id), exercise.id);
    const { error: updateError } = await supabase.from('session_runs').update({ current_exercise: Math.max(0, nextExercise), current_set: 1, phase: 'exercise', phase_ends_at: null }).eq('id', run.id);
    if (updateError) throw updateError;
    return { ok: true, data: { nextExercise, nextSet: 1, restSeconds: 0, sessionComplete } };
  } catch (error) {
    return asResult(error, 'No fue posible omitir el ejercicio.');
  }
}

export async function finishSession(input: { id: string; elapsedSeconds: number; rpe: number; notes: string }): Promise<ActionResult<{ workoutId: string }>> {
  try {
    const { supabase, userId } = await requireUser();
    const { data: run } = await supabase.from('session_runs').select('*,planned_sessions(*)').eq('id', input.id).eq('profile_id', userId).single();
    if (!run || run.status === 'completed') return { ok: false, error: 'La sesión ya terminó o no existe.' };
    const session = run.planned_sessions;
    const { data: workout, error } = await supabase.from('workouts').insert({
      profile_id: userId, session_run_id: run.id, planned_session_id: run.planned_session_id,
      performed_on: localISODate(), activity_type: 'strength', title: session?.title ?? 'Sesión guiada',
      duration_minutes: Math.max(1, Math.round(input.elapsedSeconds / 60)), intensity_rpe: input.rpe, notes: input.notes || null,
    }).select('id').single();
    if (error) throw error;
    const { data: logs } = await supabase.from('session_set_logs').select('planned_session_exercise_id,reps_completed,rpe,status,planned_session_exercises(exercise_id,position,exercise_catalog(name))').eq('session_run_id',run.id).eq('status','completed');
    type CompletedExercise = { exercise_id: string | null; name: string; position: number; sets: number; reps: number; rpes: number[] };
    const grouped = new Map<string, CompletedExercise>();
    for (const log of logs ?? []) {
      const planned = Array.isArray(log.planned_session_exercises) ? log.planned_session_exercises[0] : log.planned_session_exercises;
      if (!planned) continue;
      const catalog = Array.isArray(planned.exercise_catalog) ? planned.exercise_catalog[0] : planned.exercise_catalog;
      const current: CompletedExercise = grouped.get(log.planned_session_exercise_id) ?? {
        exercise_id: planned.exercise_id,
        name: catalog?.name ?? 'Ejercicio',
        position: planned.position,
        sets: 0,
        reps: 0,
        rpes: [],
      };
      current.sets += 1;
      current.reps += log.reps_completed ?? 0;
      if (log.rpe !== null) current.rpes.push(log.rpe);
      grouped.set(log.planned_session_exercise_id, current);
    }
    if(grouped.size){const{error:exerciseError}=await supabase.from('workout_exercises').insert([...grouped.values()].map((item)=>({workout_id:workout.id,exercise_id:item.exercise_id,exercise_name:item.name,sets:item.sets,reps:item.reps,rpe:item.rpes.length?item.rpes.reduce((sum,value)=>sum+value,0)/item.rpes.length:null,position:item.position})));if(exerciseError)throw exerciseError;}
    await supabase.from('session_runs').update({ status: 'completed', ended_at: new Date().toISOString(), elapsed_seconds: input.elapsedSeconds, phase_ends_at: null }).eq('id', run.id);
    revalidatePath('/hoy'); revalidatePath('/actividad'); revalidatePath('/plan');
    return { ok: true, data: { workoutId: workout.id } };
  } catch (error) { return asResult(error, 'No fue posible finalizar la sesión.'); }
}

export async function saveMetric(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = metricSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from('body_metrics').upsert({ profile_id: userId, ...parsed.data, notes: parsed.data.notes || null }, { onConflict: 'profile_id,recorded_on' });
  if (error) return { status: 'error', message: 'No fue posible guardar la medición.' };
  if (parsed.data.height_cm) await supabase.from('profiles').update({ height_cm: parsed.data.height_cm }).eq('id', userId);
  revalidatePath('/progreso');
  return { status: 'success', message: 'Medición registrada. GLM no infiere cambios que no hayas registrado.' };
}

export async function saveActivity(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = activitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from('workouts').insert({ profile_id: userId, ...parsed.data, notes: parsed.data.notes || null });
  if (error) return { status: 'error', message: 'No fue posible guardar la actividad.' };
  revalidatePath('/actividad'); revalidatePath('/hoy');
  return { status: 'success', message: 'Actividad real registrada.' };
}

export async function estimateNutritionTargets(): Promise<ActionResult> {
  try {
    const { supabase, userId, profile } = await requireProfile();
    const [{ data: nutrition }, { data: training }, { data: metric }] = await Promise.all([
      supabase.from('nutrition_profiles').select('*').eq('profile_id', userId).single(),
      supabase.from('training_profiles').select('*').eq('profile_id', userId).single(),
      supabase.from('body_metrics').select('weight_kg').eq('profile_id', userId).not('weight_kg', 'is', null).order('recorded_on', { ascending: false }).limit(1).single(),
    ]);
    const n = nutrition as NutritionProfile;
    if (n.pregnancy_or_lactation || n.eating_disorder || n.renal_or_metabolic_condition) return { ok: false, error: 'El cálculo automático está desactivado por seguridad. Consulta a un profesional.' };
    if (!n.energy_calculation_sex || !metric?.weight_kg) return { ok: false, error: 'Falta la referencia fisiológica o un peso registrado.' };
    const estimate = estimateNutrition({ sex: n.energy_calculation_sex, age: ageOn(profile.birth_date), weightKg: metric.weight_kg, heightCm: profile.height_cm, activity: training.current_activity, goal: profile.goal });
    const { error } = await supabase.from('nutrition_profiles').update({ energy_target_min: estimate.energyMin, energy_target_max: estimate.energyMax, protein_target_min: estimate.proteinMin, protein_target_max: estimate.proteinMax, target_confirmed_at: null }).eq('profile_id', userId);
    if (error) throw error;
    revalidatePath('/alimentacion');
    return { ok: true, data: undefined, message: 'Estimación preparada. Confírmala antes de generar el menú.' };
  } catch (error) { return asResult(error, 'No fue posible estimar tus referencias.'); }
}

export async function confirmNutritionTargets(): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from('nutrition_profiles').update({ target_confirmed_at: new Date().toISOString() }).eq('profile_id', userId).not('energy_target_min', 'is', null);
    if (error) throw error;
    revalidatePath('/alimentacion');
    return { ok: true, data: undefined };
  } catch (error) { return asResult(error, 'No fue posible confirmar las referencias.'); }
}

export async function generateMealPlan(weekStart = mondayOf(localISODate())): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const [{ data: nutrition }, { data: recipes }, { data: ingredients }] = await Promise.all([
      supabase.from('nutrition_profiles').select('*').eq('profile_id', userId).single(),
      supabase.from('recipes').select('*').eq('active', true),
      supabase.from('recipe_ingredients').select('recipe_id,foods(name)'),
    ]);
    const n = nutrition as NutritionProfile;
    if (!n.target_confirmed_at || !n.energy_target_min || !n.energy_target_max || !n.protein_target_min || !n.protein_target_max) return { ok: false, error: 'Confirma primero tu rango estimado.' };
    const disliked = n.disliked_foods.map((item) => item.toLowerCase());
    const blockedRecipes = new Set((ingredients ?? []).filter((item) => {
      const relatedFood = Array.isArray(item.foods) ? item.foods[0] : item.foods;
      return disliked.some((food) => relatedFood?.name?.toLowerCase().includes(food));
    }).map((item) => item.recipe_id));
    const compatibleRecipes = ((recipes ?? []) as Recipe[]).filter((recipe) => recipe.prep_minutes <= n.cooking_minutes && !blockedRecipes.has(recipe.id));
    const items = buildMealWeek({ weekStart, recipes: compatibleRecipes, diet: n.diet_pattern, allergies: n.allergies, mealsPerDay: n.meals_per_day, targetCalories: Math.round((n.energy_target_min + n.energy_target_max) / 2) });
    const existing = await supabase.from('meal_plans').select('id').eq('profile_id', userId).eq('week_start', weekStart).maybeSingle();
    if (existing.data) await supabase.from('meal_plans').delete().eq('id', existing.data.id);
    const { data: plan, error } = await supabase.from('meal_plans').insert({ profile_id: userId, week_start: weekStart, energy_target_min: n.energy_target_min, energy_target_max: n.energy_target_max, protein_target_min: n.protein_target_min, protein_target_max: n.protein_target_max, source_keys: ['NOM_043', 'WHO_HEALTHY_DIET', 'USDA_FDC', 'MIFFLIN_1990'] }).select('id').single();
    if (error) throw error;
    const itemResult = await supabase.from('meal_plan_items').insert(items.map((item) => ({ meal_plan_id: plan.id, ...item })));
    if (itemResult.error) throw itemResult.error;
    revalidatePath('/alimentacion'); revalidatePath('/hoy');
    return { ok: true, data: undefined };
  } catch (error) { return asResult(error, 'No fue posible generar el menú.'); }
}

export async function swapMeal(itemId: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { data: item } = await supabase.from('meal_plan_items').select('*,recipes(*),meal_plans!inner(profile_id)').eq('id', itemId).single();
    if (!item || item.meal_plans.profile_id !== userId) return { ok: false, error: 'Comida no encontrada.' };
    const { data: nutrition } = await supabase.from('nutrition_profiles').select('*').eq('profile_id', userId).single();
    const { data: alternatives } = await supabase.from('recipes').select('*').eq('slot', item.slot).contains('diet_patterns', [nutrition.diet_pattern]).neq('id', item.recipe_id).eq('active', true);
    const allowed = (alternatives ?? []).filter((recipe) => !recipe.allergens.some((a: string) => nutrition.allergies.includes(a)));
    if (!allowed.length) return { ok: false, error: 'No hay otra receta compatible con tus restricciones.' };
    const next = allowed[Math.floor(Math.random() * allowed.length)];
    const { error } = await supabase.from('meal_plan_items').update({ recipe_id: next.id }).eq('id', itemId);
    if (error) throw error;
    revalidatePath('/alimentacion');
    return { ok: true, data: undefined };
  } catch (error) { return asResult(error, 'No fue posible sustituir la comida.'); }
}

export async function markMeal(itemId: string, status: 'completed' | 'skipped'): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase.from('meal_logs').upsert({ profile_id: userId, meal_plan_item_id: itemId, status }, { onConflict: 'profile_id,meal_plan_item_id' });
    if (error) throw error;
    revalidatePath('/alimentacion'); revalidatePath('/hoy');
    return { ok: true, data: undefined };
  } catch (error) { return asResult(error, 'No fue posible actualizar la comida.'); }
}

export async function updateTrainingSettings(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = trainingSettingsSchema.safeParse({ ...Object.fromEntries(formData), equipment: formData.getAll('equipment') });
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from('training_profiles').update({ ...parsed.data, limitations: parsed.data.limitations || null }).eq('profile_id', userId);
  if (error) return { status: 'error', message: 'No fue posible actualizar la evaluación.' };
  revalidatePath('/ajustes'); revalidatePath('/plan');
  return { status: 'success', message: 'Situación física y equipo actualizados.' };
}

export async function updateNutritionSettings(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = nutritionSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from('nutrition_profiles').update({ ...parsed.data, energy_target_min: null, energy_target_max: null, protein_target_min: null, protein_target_max: null, target_confirmed_at: null }).eq('profile_id', userId);
  if (error) return { status: 'error', message: 'No fue posible actualizar la alimentación.' };
  revalidatePath('/ajustes'); revalidatePath('/alimentacion');
  return { status: 'success', message: 'Preferencias actualizadas. Vuelve a calcular y confirmar las referencias.' };
}

import { z } from 'zod';
import { ageOn } from './date';

const optionalList = z.string().trim().max(500).transform((value) => value ? value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean) : []);
const bool = z.preprocess((value) => value === true || value === 'on' || value === 'true', z.boolean());

export const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  birth_date: z.iso.date().refine((value) => ageOn(value) >= 18, 'Debes tener al menos 18 años.'),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).or(z.literal('')).transform((value) => value || null),
  height_cm: z.coerce.number().min(100).max(250),
  weight_kg: z.coerce.number().min(30).max(350),
  goal: z.enum(['body_recomposition', 'fat_loss', 'muscle_gain', 'fitness']),
  timezone: z.string().min(1).max(80),
  local_date: z.iso.date(),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  current_activity: z.enum(['inactive', 'light', 'regular', 'very_active']),
  available_days: z.coerce.number().int().min(2).max(6),
  session_minutes: z.coerce.number().int().min(15).max(120),
  equipment: z.array(z.enum(['none', 'bands', 'dumbbells', 'gym'])).min(1),
  limitations: z.string().trim().max(1000),
  has_medical_condition: bool,
  professional_clearance: bool,
  diet_pattern: z.enum(['omnivore', 'vegetarian', 'vegan']),
  allergies: optionalList,
  disliked_foods: optionalList,
  meals_per_day: z.coerce.number().int().min(3).max(4),
  cooking_minutes: z.coerce.number().int().min(10).max(120),
  energy_calculation_sex: z.enum(['male', 'female']).or(z.literal('')).transform((value) => value || null),
  pregnancy_or_lactation: bool,
  eating_disorder: bool,
  renal_or_metabolic_condition: bool,
  accepted_terms: z.literal('on', { error: 'Debes aceptar los términos.' }),
  accepted_safety: z.literal('on', { error: 'Debes aceptar el aviso de seguridad.' }),
});

export const dailyCheckinSchema = z.object({
  recorded_on: z.iso.date(),
  energy: z.coerce.number().int().min(1).max(5),
  sleep_quality: z.coerce.number().int().min(1).max(5),
  stress: z.coerce.number().int().min(1).max(5),
  soreness: z.coerce.number().int().min(1).max(5),
  readiness: z.coerce.number().int().min(1).max(5),
  pain: bool,
  dizziness: bool,
  chest_pain: bool,
  notes: z.string().trim().max(500),
});

export const weeklyCheckinSchema = z.object({
  week_start: z.iso.date(),
  energy: z.coerce.number().int().min(1).max(5),
  recovery: z.coerce.number().int().min(1).max(5),
  soreness: z.coerce.number().int().min(1).max(5),
  pain: bool,
  notes: z.string().trim().max(1000),
});

export const metricSchema = z.object({
  recorded_on: z.iso.date(),
  weight_kg: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().min(30).max(350).optional()),
  height_cm: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().min(100).max(250).optional()),
  waist_cm: z.preprocess((v) => v === '' ? undefined : v, z.coerce.number().min(30).max(250).optional()),
  notes: z.string().trim().max(500),
}).refine((value) => value.weight_kg || value.height_cm || value.waist_cm, { message: 'Registra al menos una medición.' });

export const activitySchema = z.object({
  performed_on: z.iso.date(),
  activity_type: z.enum(['strength', 'walking', 'running', 'cycling', 'sport', 'mobility', 'other']),
  title: z.string().trim().min(2).max(120),
  duration_minutes: z.coerce.number().int().min(1).max(600),
  intensity_rpe: z.preprocess((v) => v === '' ? null : v, z.coerce.number().min(1).max(10).nullable()),
  notes: z.string().trim().max(2000),
});

export const coachSchema = z.object({
  conversation_id: z.preprocess((v) => v === '' ? undefined : v, z.uuid().optional()),
  message: z.string().trim().min(2).max(1000),
  context_type: z.enum(['general', 'daily', 'session', 'exercise', 'meal']),
});

export const trainingSettingsSchema = z.object({
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  current_activity: z.enum(['inactive', 'light', 'regular', 'very_active']),
  available_days: z.coerce.number().int().min(2).max(6),
  session_minutes: z.coerce.number().int().min(15).max(120),
  equipment: z.array(z.enum(['none', 'bands', 'dumbbells', 'gym'])).min(1),
  limitations: z.string().trim().max(1000),
  current_pain: bool,
  has_medical_condition: bool,
  professional_clearance: bool,
});

export const nutritionSettingsSchema = z.object({
  diet_pattern: z.enum(['omnivore', 'vegetarian', 'vegan']),
  allergies: optionalList,
  disliked_foods: optionalList,
  meals_per_day: z.coerce.number().int().min(3).max(4),
  cooking_minutes: z.coerce.number().int().min(10).max(120),
  energy_calculation_sex: z.enum(['male', 'female']).or(z.literal('')).transform((value) => value || null),
  pregnancy_or_lactation: bool,
  eating_disorder: bool,
  renal_or_metabolic_condition: bool,
});

export const registerPhotoMealSchema = z.object({
  imagePath: z.string().min(1).max(500),
  imageType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  imageSize: z.number().int().min(1).max(5 * 1024 * 1024),
});

export const refinePhotoMealSchema = z.object({
  mealId: z.uuid(),
  answers: z.string().trim().min(2).max(2000),
});

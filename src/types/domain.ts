export type Goal = 'body_recomposition' | 'fat_loss' | 'muscle_gain' | 'fitness';
export type ProfileSex = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'inactive' | 'light' | 'regular' | 'very_active';
export type PlanAdjustment = 'baseline' | 'progress' | 'maintain' | 'recovery' | 'paused';
export type RecommendationStatus = 'normal' | 'reduced' | 'paused';
export type DietPattern = 'omnivore' | 'vegetarian' | 'vegan';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type SessionSetLog = {
  id: string;
  session_run_id: string;
  planned_session_exercise_id: string;
  set_number: number;
  status: 'completed' | 'skipped';
  reps_completed: number | null;
  rpe: number | null;
  completed_at: string;
};

export type Profile = {
  id: string;
  name: string;
  birth_date: string;
  sex: ProfileSex | null;
  height_cm: number;
  goal: Goal;
  timezone: string;
};

export type TrainingProfile = {
  profile_id: string;
  experience: Experience;
  current_activity: ActivityLevel;
  available_days: number;
  session_minutes: number;
  equipment: string[];
  limitations: string | null;
  current_pain: boolean;
  has_medical_condition: boolean;
  professional_clearance: boolean;
};

export type NutritionProfile = {
  profile_id: string;
  diet_pattern: DietPattern;
  allergies: string[];
  disliked_foods: string[];
  meals_per_day: number;
  cooking_minutes: number;
  energy_calculation_sex: ProfileSex | null;
  energy_target_min: number | null;
  energy_target_max: number | null;
  protein_target_min: number | null;
  protein_target_max: number | null;
  target_confirmed_at: string | null;
  pregnancy_or_lactation: boolean;
  eating_disorder: boolean;
  renal_or_metabolic_condition: boolean;
};

export type DailyCheckin = {
  recorded_on: string;
  energy: number;
  sleep_quality: number;
  stress: number;
  soreness: number;
  readiness: number;
  pain: boolean;
  dizziness: boolean;
  chest_pain: boolean;
  notes: string | null;
};

export type Exercise = {
  id: string;
  slug: string;
  name: string;
  movement: string;
  level: Experience;
  equipment: string[];
  goals: Goal[];
  instructions: string[];
  cues: string[];
  common_mistakes: string[];
  illustration_key: string;
  video_url: string;
  video_source: string;
  source_url: string;
};

export type PlannedExerciseDraft = {
  exercise_id: string;
  name: string;
  position: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  note?: string;
};

export type PlannedSessionDraft = {
  day_index: number;
  title: string;
  focus: string;
  duration_minutes: number;
  target_rpe: number;
  exercises: PlannedExerciseDraft[];
};

export type WeeklyPlanDraft = {
  adjustment: PlanAdjustment;
  rationale: string;
  sourceKeys: string[];
  sessions: PlannedSessionDraft[];
};

export type Recipe = {
  id: string;
  slug: string;
  name: string;
  slot: MealSlot;
  diet_patterns: DietPattern[];
  cuisine: 'mexican' | 'international';
  instructions: string[];
  prep_minutes: number;
  calories: number;
  protein_g: number;
  allergens: string[];
  source_note: string;
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

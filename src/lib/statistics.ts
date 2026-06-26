import { addDays, localISODate } from "@/lib/date";

export type StatisticsRange = "7d" | "30d";

export type WorkoutStatInput = {
  performed_on: string;
  duration_minutes: number | string | null;
  intensity_rpe: number | string | null;
};

export type CompletedPlannedMealInput = {
  planned_on: string;
  servings: number | string | null;
  calories: number | string | null;
  protein_g: number | string | null;
};

export type ConsumedPhotoMealInput = {
  consumed_at: string | null;
  calories_estimated: number | string | null;
  protein_estimated: number | string | null;
  carbs_estimated: number | string | null;
  fat_estimated: number | string | null;
};

export type PendingPhotoMealInput = {
  analysis_status: string | null;
};

export type MetricStatInput = {
  recorded_on: string;
  weight_kg: number | string | null;
  height_cm: number | string | null;
  waist_cm: number | string | null;
};

export type DailyStatistic = {
  date: string;
  workouts: number;
  activityMinutes: number;
  plannedMeals: number;
  photoMeals: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type StatisticsSummary = {
  range: StatisticsRange;
  startDate: string;
  endDate: string;
  days: DailyStatistic[];
  activity: {
    totalMinutes: number;
    workouts: number;
    activeDays: number;
    averageDifficulty: number | null;
  };
  nutrition: {
    completedPlannedMeals: number;
    consumedPhotoMeals: number;
    foodDays: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  progress: {
    measurements: number;
    latest: MetricStatInput | null;
  };
  pending: {
    photoMeals: number;
    failedAnalysis: number;
  };
  maxima: {
    activityMinutes: number;
    calories: number;
  };
  hasAnyData: boolean;
};

export function buildStatisticsSummary({
  range,
  today = localISODate(),
  workouts,
  completedPlannedMeals,
  consumedPhotoMeals,
  pendingPhotoMeals,
  metrics,
  latestMetric,
}: {
  range: StatisticsRange;
  today?: string;
  workouts: WorkoutStatInput[];
  completedPlannedMeals: CompletedPlannedMealInput[];
  consumedPhotoMeals: ConsumedPhotoMealInput[];
  pendingPhotoMeals: PendingPhotoMealInput[];
  metrics: MetricStatInput[];
  latestMetric: MetricStatInput | null;
}): StatisticsSummary {
  const length = range === "30d" ? 30 : 7;
  const startDate = addDays(today, -(length - 1));
  const days = Array.from({ length }, (_, index) => emptyDay(addDays(startDate, index)));
  const byDate = new Map(days.map((day) => [day.date, day]));

  let rpeSum = 0;
  let rpeCount = 0;

  for (const workout of workouts) {
    const day = byDate.get(workout.performed_on);
    if (!day) continue;
    day.workouts += 1;
    day.activityMinutes += safeNumber(workout.duration_minutes);
    const rpe = safeNullableNumber(workout.intensity_rpe);
    if (rpe !== null) {
      rpeSum += rpe;
      rpeCount += 1;
    }
  }

  for (const meal of completedPlannedMeals) {
    const day = byDate.get(meal.planned_on);
    if (!day) continue;
    const servings = safeNumber(meal.servings || 1);
    day.plannedMeals += 1;
    day.calories += safeNumber(meal.calories) * servings;
    day.protein += safeNumber(meal.protein_g) * servings;
  }

  for (const meal of consumedPhotoMeals) {
    const date = meal.consumed_at?.slice(0, 10);
    if (!date) continue;
    const day = byDate.get(date);
    if (!day) continue;
    day.photoMeals += 1;
    day.calories += safeNumber(meal.calories_estimated);
    day.protein += safeNumber(meal.protein_estimated);
    day.carbs += safeNumber(meal.carbs_estimated);
    day.fat += safeNumber(meal.fat_estimated);
  }

  const activityMinutes = days.reduce((sum, day) => sum + day.activityMinutes, 0);
  const workoutsCount = days.reduce((sum, day) => sum + day.workouts, 0);
  const completedPlannedMealsCount = days.reduce((sum, day) => sum + day.plannedMeals, 0);
  const consumedPhotoMealsCount = days.reduce((sum, day) => sum + day.photoMeals, 0);
  const calories = days.reduce((sum, day) => sum + day.calories, 0);
  const protein = days.reduce((sum, day) => sum + day.protein, 0);
  const carbs = days.reduce((sum, day) => sum + day.carbs, 0);
  const fat = days.reduce((sum, day) => sum + day.fat, 0);
  const failedAnalysis = pendingPhotoMeals.filter((meal) => meal.analysis_status === "failed").length;

  return {
    range,
    startDate,
    endDate: today,
    days,
    activity: {
      totalMinutes: Math.round(activityMinutes),
      workouts: workoutsCount,
      activeDays: days.filter((day) => day.activityMinutes > 0).length,
      averageDifficulty: rpeCount ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
    },
    nutrition: {
      completedPlannedMeals: completedPlannedMealsCount,
      consumedPhotoMeals: consumedPhotoMealsCount,
      foodDays: days.filter((day) => day.plannedMeals + day.photoMeals > 0).length,
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    },
    progress: {
      measurements: metrics.filter((metric) => byDate.has(metric.recorded_on)).length,
      latest: latestMetric,
    },
    pending: {
      photoMeals: pendingPhotoMeals.length,
      failedAnalysis,
    },
    maxima: {
      activityMinutes: Math.max(1, ...days.map((day) => day.activityMinutes)),
      calories: Math.max(1, ...days.map((day) => day.calories)),
    },
    hasAnyData:
      workoutsCount > 0 ||
      completedPlannedMealsCount > 0 ||
      consumedPhotoMealsCount > 0 ||
      metrics.length > 0 ||
      pendingPhotoMeals.length > 0,
  };
}

export function normalizeStatisticsRange(value: string | undefined): StatisticsRange {
  return value === "30d" ? "30d" : "7d";
}

function emptyDay(date: string): DailyStatistic {
  return {
    date,
    workouts: 0,
    activityMinutes: 0,
    plannedMeals: 0,
    photoMeals: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
}

function safeNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

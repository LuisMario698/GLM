import { describe, expect, it } from 'vitest';
import { buildStatisticsSummary, normalizeStatisticsRange } from '@/lib/statistics';

describe('statistics summary', () => {
  it('aggregates activity and ignores empty difficulty', () => {
    const summary = buildStatisticsSummary({
      range: '7d',
      today: '2026-06-26',
      workouts: [
        { performed_on: '2026-06-25', duration_minutes: 30, intensity_rpe: 6 },
        { performed_on: '2026-06-25', duration_minutes: 20, intensity_rpe: null },
        { performed_on: '2026-06-10', duration_minutes: 90, intensity_rpe: 10 },
      ],
      completedPlannedMeals: [],
      consumedPhotoMeals: [],
      pendingPhotoMeals: [],
      metrics: [],
      latestMetric: null,
    });

    expect(summary.activity.totalMinutes).toBe(50);
    expect(summary.activity.workouts).toBe(2);
    expect(summary.activity.activeDays).toBe(1);
    expect(summary.activity.averageDifficulty).toBe(6);
  });

  it('combines completed planned meals and consumed photo meals', () => {
    const summary = buildStatisticsSummary({
      range: '7d',
      today: '2026-06-26',
      workouts: [],
      completedPlannedMeals: [
        { planned_on: '2026-06-26', servings: 1.5, calories: 400, protein_g: 20 },
      ],
      consumedPhotoMeals: [
        { consumed_at: '2026-06-26T18:00:00Z', calories_estimated: 500, protein_estimated: 30, carbs_estimated: 60, fat_estimated: 15 },
      ],
      pendingPhotoMeals: [],
      metrics: [],
      latestMetric: null,
    });

    expect(summary.nutrition.completedPlannedMeals).toBe(1);
    expect(summary.nutrition.consumedPhotoMeals).toBe(1);
    expect(summary.nutrition.calories).toBe(1100);
    expect(summary.nutrition.protein).toBe(60);
    expect(summary.nutrition.carbs).toBe(60);
    expect(summary.nutrition.fat).toBe(15);
  });

  it('counts pending and failed photo meals', () => {
    const summary = buildStatisticsSummary({
      range: '7d',
      today: '2026-06-26',
      workouts: [],
      completedPlannedMeals: [],
      consumedPhotoMeals: [],
      pendingPhotoMeals: [{ analysis_status: 'failed' }, { analysis_status: 'needs_review' }],
      metrics: [],
      latestMetric: null,
    });

    expect(summary.pending.photoMeals).toBe(2);
    expect(summary.pending.failedAnalysis).toBe(1);
    expect(summary.hasAnyData).toBe(true);
  });

  it('keeps latest progress separate from range count', () => {
    const latest = { recorded_on: '2026-06-01', weight_kg: 80, height_cm: 180, waist_cm: null };
    const summary = buildStatisticsSummary({
      range: '7d',
      today: '2026-06-26',
      workouts: [],
      completedPlannedMeals: [],
      consumedPhotoMeals: [],
      pendingPhotoMeals: [],
      metrics: [{ recorded_on: '2026-06-24', weight_kg: 81, height_cm: null, waist_cm: 90 }],
      latestMetric: latest,
    });

    expect(summary.progress.measurements).toBe(1);
    expect(summary.progress.latest).toEqual(latest);
  });

  it('normalizes unsupported ranges to seven days', () => {
    expect(normalizeStatisticsRange('30d')).toBe('30d');
    expect(normalizeStatisticsRange('year')).toBe('7d');
    expect(normalizeStatisticsRange(undefined)).toBe('7d');
  });
});

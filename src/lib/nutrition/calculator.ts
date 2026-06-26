import type { ActivityLevel, Goal, ProfileSex } from '@/types/domain';

export type NutritionEstimate = {
  energyMin: number;
  energyMax: number;
  proteinMin: number;
  proteinMax: number;
  maintenance: number;
};

const activityFactor: Record<ActivityLevel, number> = { inactive: 1.2, light: 1.375, regular: 1.55, very_active: 1.725 };
const goalFactor: Record<Goal, number> = { body_recomposition: 1, fitness: 1, fat_loss: 0.9, muscle_gain: 1.075 };

export function estimateNutrition(input: {
  sex: ProfileSex;
  age: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: Goal;
}): NutritionEstimate {
  if (input.sex !== 'male' && input.sex !== 'female') throw new Error('Se requiere una referencia fisiológica para estimar energía.');
  const sexConstant = input.sex === 'male' ? 5 : -161;
  const resting = (10 * input.weightKg) + (6.25 * input.heightCm) - (5 * input.age) + sexConstant;
  const maintenance = resting * activityFactor[input.activity];
  const target = maintenance * goalFactor[input.goal];
  const proteinBase = input.goal === 'muscle_gain' || input.goal === 'body_recomposition' ? 1.6 : input.activity === 'inactive' ? 1.2 : 1.4;
  return {
    energyMin: Math.max(1200, round50(target * 0.9)),
    energyMax: Math.max(1300, round50(target * 1.1)),
    proteinMin: Math.round(input.weightKg * proteinBase),
    proteinMax: Math.round(input.weightKg * Math.min(2, proteinBase + 0.3)),
    maintenance: round50(maintenance),
  };
}

function round50(value: number) { return Math.round(value / 50) * 50; }

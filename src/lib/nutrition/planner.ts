import { addDays } from '@/lib/date';
import type { DietPattern, MealSlot, Recipe } from '@/types/domain';

export type MealDraft = { planned_on: string; slot: MealSlot; recipe_id: string; servings: number };

export function buildMealWeek(input: {
  weekStart: string;
  recipes: Recipe[];
  diet: DietPattern;
  allergies: string[];
  mealsPerDay: number;
  targetCalories: number;
}): MealDraft[] {
  const blocked = new Set(input.allergies.map(normalizeAllergen));
  const allowed = input.recipes.filter((recipe) =>
    recipe.diet_patterns.includes(input.diet) && !recipe.allergens.some((allergen) => blocked.has(normalizeAllergen(allergen))),
  );
  const slots: MealSlot[] = input.mealsPerDay === 4 ? ['breakfast', 'lunch', 'dinner', 'snack'] : ['breakfast', 'lunch', 'dinner'];
  const bySlot = Object.fromEntries(slots.map((slot) => [slot, allowed.filter((recipe) => recipe.slot === slot)])) as Record<MealSlot, Recipe[]>;
  if (slots.some((slot) => !bySlot[slot]?.length)) throw new Error('No hay suficientes recetas compatibles con tus restricciones.');

  return Array.from({ length: 7 }, (_, day) => {
    const chosen = slots.map((slot, slotIndex) => bySlot[slot][(day + slotIndex) % bySlot[slot].length]);
    const total = chosen.reduce((sum, recipe) => sum + recipe.calories, 0);
    const servings = Math.max(0.75, Math.min(1.5, Math.round((input.targetCalories / total) * 4) / 4));
    return chosen.map((recipe) => ({ planned_on: addDays(input.weekStart, day), slot: recipe.slot, recipe_id: recipe.id, servings }));
  }).flat();
}

function normalizeAllergen(value: string) {
  const normalized = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aliases: Record<string, string> = { lacteos: 'dairy', leche: 'dairy', nueces: 'nuts', frutos_secos: 'nuts', huevo: 'egg', soya: 'soy', soja: 'soy', pescado: 'fish' };
  return aliases[normalized.replace(/\s+/g, '_')] ?? normalized;
}

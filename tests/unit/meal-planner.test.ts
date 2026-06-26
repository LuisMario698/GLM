import { describe, expect, it } from 'vitest';
import { buildMealWeek } from '@/lib/nutrition/planner';
import type { Recipe } from '@/types/domain';

const recipes:Recipe[]=['breakfast','lunch','dinner','snack'].map((slot,index)=>({id:String(index),slug:String(index),name:String(slot),slot:slot as Recipe['slot'],diet_patterns:['vegan'],cuisine:'international',instructions:[],prep_minutes:10,calories:400,protein_g:20,allergens:index===3?['nuts']:[],source_note:'test'}));
describe('meal planner',()=>{
  it('creates seven complete days',()=>expect(buildMealWeek({weekStart:'2026-06-22',recipes,diet:'vegan',allergies:[],mealsPerDay:3,targetCalories:1800})).toHaveLength(21));
  it('hard-excludes allergens and fails if a slot becomes unavailable',()=>expect(()=>buildMealWeek({weekStart:'2026-06-22',recipes,diet:'vegan',allergies:['nuts'],mealsPerDay:4,targetCalories:2000})).toThrow());
  it('normalizes Spanish allergen names',()=>expect(()=>buildMealWeek({weekStart:'2026-06-22',recipes,diet:'vegan',allergies:['nueces'],mealsPerDay:4,targetCalories:2000})).toThrow());
});

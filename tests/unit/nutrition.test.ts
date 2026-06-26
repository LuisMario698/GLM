import { describe, expect, it } from 'vitest';
import { estimateNutrition } from '@/lib/nutrition/calculator';

describe('nutrition estimate',()=>{
  it('returns a transparent range around a conservative fat-loss target',()=>{const value=estimateNutrition({sex:'male',age:30,weightKg:90,heightCm:180,activity:'light',goal:'fat_loss'});expect(value.energyMin).toBeLessThan(value.energyMax);expect(value.energyMax).toBeLessThan(value.maintenance*1.05);expect(value.proteinMin).toBeGreaterThan(100)});
  it('refuses a non-physiological reference',()=>expect(()=>estimateNutrition({sex:'prefer_not_to_say',age:30,weightKg:70,heightCm:170,activity:'light',goal:'fitness'})).toThrow());
});

import { describe, expect, it } from 'vitest';
import {
  buildPhotoMealPath,
  canConsumePhotoMeal,
  parsePhotoMealAnalysis,
  photoMealPathSchema,
  validatePhotoMealUpload,
  validateStoredPhotoMeal,
} from '@/lib/photo-meals';

describe('photo meal helpers', () => {
  it('validates supported image uploads', () => {
    expect(validatePhotoMealUpload({ type: 'image/jpeg', size: 500_000 })).toBeNull();
    expect(validatePhotoMealUpload({ type: 'application/pdf', size: 500_000 })).toMatch(/JPG/);
    expect(validatePhotoMealUpload({ type: 'image/webp', size: 13 * 1024 * 1024 })).toMatch(/12 MB/);
    expect(validateStoredPhotoMeal({ type: 'image/webp', size: 5 * 1024 * 1024 })).toMatch(/comprimir/);
  });

  it('builds user-scoped storage paths', () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    const imageId = '22222222-2222-4222-8222-222222222222';
    const path = buildPhotoMealPath(userId, 'image/webp', imageId);
    expect(path).toContain(`${userId}/`);
    expect(path).toContain(`${imageId}.webp`);
    expect(photoMealPathSchema.safeParse(path).success).toBe(true);
    expect(photoMealPathSchema.safeParse(`other/${imageId}.webp`).success).toBe(false);
  });

  it('parses structured AI output', () => {
    const parsed = parsePhotoMealAnalysis(JSON.stringify({
      title: 'Tacos de pollo',
      detected_items: [{ name: 'Tortilla', quantity_estimate: '2 piezas', confidence: 0.8 }],
      analysis_questions: ['¿Cuánta salsa tenía?'],
      nutrition: { calories: 430, protein_g: 28, carbs_g: 45, fat_g: 14 },
    }));
    expect(parsed.title).toBe('Tacos de pollo');
    expect(parsed.nutrition.protein_g).toBe(28);
  });

  it('only pending meals can be marked consumed', () => {
    expect(canConsumePhotoMeal('pending')).toBe(true);
    expect(canConsumePhotoMeal('consumed')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { onboardingSchema } from '@/lib/validations';

const valid={name:'Mario',birth_date:'1995-01-01',sex:'male',height_cm:'180',weight_kg:'85',goal:'fitness',timezone:'America/Hermosillo',local_date:'2026-06-24',experience:'beginner',current_activity:'light',available_days:'3',session_minutes:'40',equipment:['none'],limitations:'',has_medical_condition:false,professional_clearance:false,diet_pattern:'omnivore',allergies:'',disliked_foods:'',meals_per_day:'3',cooking_minutes:'30',energy_calculation_sex:'male',pregnancy_or_lactation:false,eating_disorder:false,renal_or_metabolic_condition:false,accepted_terms:'on',accepted_safety:'on'};
describe('onboarding validation',()=>{
  it('accepts a complete adult profile',()=>expect(onboardingSchema.safeParse(valid).success).toBe(true));
  it('rejects a minor',()=>expect(onboardingSchema.safeParse({...valid,birth_date:'2012-01-01'}).success).toBe(false));
  it('requires safety consent',()=>expect(onboardingSchema.safeParse({...valid,accepted_safety:undefined}).success).toBe(false));
});

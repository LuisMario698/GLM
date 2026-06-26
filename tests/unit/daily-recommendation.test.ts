import { describe, expect, it } from 'vitest';
import { recommendToday } from '@/lib/recommendations/daily';
import type { DailyCheckin } from '@/types/domain';

const base: DailyCheckin = { recorded_on:'2026-06-24',energy:4,sleep_quality:4,stress:2,soreness:2,readiness:4,pain:false,dizziness:false,chest_pain:false,notes:null };
describe('daily recommendation',()=>{
  it('keeps a normal session when recovery is adequate',()=>expect(recommendToday(base).status).toBe('normal'));
  it('reduces volume by 25 percent for poor recovery',()=>{const result=recommendToday({...base,sleep_quality:2});expect(result.status).toBe('reduced');expect(result.volumeMultiplier).toBe(.75);expect(result.rpeCap).toBe(6)});
  it('pauses and marks urgent warning for chest pain',()=>{const result=recommendToday({...base,chest_pain:true});expect(result.status).toBe('paused');expect(result.urgent).toBe(true)});
  it('pauses for current pain without prescribing an alternative',()=>expect(recommendToday({...base,pain:true}).status).toBe('paused'));
});

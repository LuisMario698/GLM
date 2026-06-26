import { describe, expect, it } from 'vitest';
import { generateWeeklyPlan } from '@/lib/recommendations/weekly';
import type { Exercise, TrainingProfile } from '@/types/domain';

const training:TrainingProfile={profile_id:'u',experience:'beginner',current_activity:'light',available_days:3,session_minutes:40,equipment:['none'],limitations:null,current_pain:false,has_medical_condition:false,professional_clearance:false};
const exercises:Exercise[]=['squat','push','hinge','core','cardio'].map((movement,index)=>({id:String(index),slug:String(index),name:movement,movement,level:'beginner',equipment:['none'],goals:['fitness'],instructions:[],cues:[],common_mistakes:[],illustration_key:movement,video_url:'https://example.com',video_source:'test',source_url:'https://example.com'}));
describe('weekly plan',()=>{
  it('creates only the available number of sessions',()=>expect(generateWeeklyPlan({training,exercises,previousPlanned:0,previousCompleted:0,averageRpe:null,checkin:null}).sessions).toHaveLength(3));
  it('pauses when pain is present',()=>expect(generateWeeklyPlan({training:{...training,current_pain:true},exercises,previousPlanned:3,previousCompleted:3,averageRpe:7,checkin:null}).adjustment).toBe('paused'));
  it('reduces sets on a recovery week',()=>{const plan=generateWeeklyPlan({training,exercises,previousPlanned:3,previousCompleted:1,averageRpe:9,checkin:{energy:2,recovery:2,soreness:4,pain:false}});expect(plan.adjustment).toBe('recovery');expect(plan.sessions[0].exercises[0].sets).toBe(2)});
});

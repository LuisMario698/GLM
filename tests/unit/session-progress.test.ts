import { describe, expect, it } from 'vitest';
import { advanceCompletedSet, advanceSkippedExercise } from '@/lib/session/progress';

describe('session progress', () => {
  const exercises = ['squat', 'row'];

  it('advances one set without changing exercise', () => {
    expect(advanceCompletedSet(exercises, 'squat', 1, 3)).toEqual({ nextExercise: 0, nextSet: 2, sessionComplete: false });
  });

  it('moves to the next exercise after its last set', () => {
    expect(advanceCompletedSet(exercises, 'squat', 3, 3)).toEqual({ nextExercise: 1, nextSet: 1, sessionComplete: false });
  });

  it('marks the session complete only after the final confirmed set', () => {
    expect(advanceCompletedSet(exercises, 'row', 3, 3)).toEqual({ nextExercise: 2, nextSet: 1, sessionComplete: true });
  });

  it('skips directly to the next exercise', () => {
    expect(advanceSkippedExercise(exercises, 'squat')).toEqual({ nextExercise: 1, nextSet: 1, sessionComplete: false });
  });
});

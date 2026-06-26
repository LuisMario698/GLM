export type SessionProgress = { nextExercise: number; nextSet: number; sessionComplete: boolean };

export function advanceCompletedSet(exerciseIds: string[], currentExerciseId: string, currentSet: number, plannedSets: number): SessionProgress {
  const currentExercise = exerciseIds.indexOf(currentExerciseId);
  if (currentExercise < 0) throw new Error('El ejercicio no pertenece a la sesión.');
  if (currentSet < plannedSets) return { nextExercise: currentExercise, nextSet: currentSet + 1, sessionComplete: false };
  const nextExercise = currentExercise + 1;
  return { nextExercise, nextSet: 1, sessionComplete: nextExercise >= exerciseIds.length };
}

export function advanceSkippedExercise(exerciseIds: string[], currentExerciseId: string): SessionProgress {
  const currentExercise = exerciseIds.indexOf(currentExerciseId);
  if (currentExercise < 0) throw new Error('El ejercicio no pertenece a la sesión.');
  const nextExercise = currentExercise + 1;
  return { nextExercise, nextSet: 1, sessionComplete: nextExercise >= exerciseIds.length };
}

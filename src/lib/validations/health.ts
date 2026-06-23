import { z } from 'zod';
export const habitSchema = z.object({ water: z.number().min(0).max(10), sleep: z.number().min(0).max(24), steps: z.number().int().min(0), protein: z.number().min(0) });
export const bodyMetricSchema = z.object({ weight: z.number().min(30).max(300), waist: z.number().min(30).max(250), neck: z.number().min(20).max(80), chest: z.number().min(50).max(200), arm: z.number().min(15).max(80) });
export const workoutExerciseSchema = z.object({ exercise_name: z.string().min(2), sets: z.number().int().min(1), reps: z.number().int().min(1), rpe: z.number().min(1).max(10) });

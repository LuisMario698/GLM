import type { ActionResult } from '@/types/domain';

export type FormState = { status: 'idle' | 'success' | 'error'; message?: string; fieldErrors?: Record<string, string[]> };
export const initialFormState: FormState = { status: 'idle' };

export function validationState(fieldErrors: Record<string, string[] | undefined>): FormState {
  return {
    status: 'error', message: 'Revisa los campos marcados.',
    fieldErrors: Object.fromEntries(Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length))),
  };
}

export function asResult<T>(error: unknown, fallback: string): ActionResult<T> {
  return { ok: false, error: error instanceof Error ? error.message : fallback };
}

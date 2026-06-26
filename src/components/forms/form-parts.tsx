'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { FormState } from '@/lib/actions/state';

export function SubmitButton({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' }) {
  const { pending } = useFormStatus();
  return <Button disabled={pending} variant={variant}>{pending ? 'Procesando…' : children}</Button>;
}
export function FormMessage({ state }: { state: FormState }) {
  return state.message ? <p role="status" className={state.status === 'error' ? 'rounded-xl bg-red-50 p-3 text-sm text-red-800' : 'rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800'}>{state.message}</p> : null;
}
export function FieldError({ state, name }: { state: FormState; name: string }) {
  return state.fieldErrors?.[name]?.[0] ? <span className="text-xs text-red-700">{state.fieldErrors[name][0]}</span> : null;
}

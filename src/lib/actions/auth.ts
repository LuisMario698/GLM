'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { FormState } from './state';

export async function signIn(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || password.length < 8) return { status: 'error', message: 'Ingresa un correo y contraseña válidos.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { status: 'error', message: 'No fue posible iniciar sesión. Revisa tus credenciales.' };
  redirect('/hoy');
}

export async function signUp(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');
  if (!email || password.length < 8 || password !== confirmation) return { status: 'error', message: 'Usa una contraseña de 8 caracteres y confirma que coincida.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email, password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/onboarding` },
  });
  if (error) return { status: 'error', message: 'No fue posible crear la cuenta.' };
  return { status: 'success', message: 'Revisa tu correo para confirmar la cuenta.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

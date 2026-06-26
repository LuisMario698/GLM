import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/domain';

export const authContext = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return { supabase, userId: error ? null : (data?.claims?.sub ?? null) };
});

export async function requireUser() {
  const context = await authContext();
  if (!context.userId) redirect('/login');
  return { ...context, userId: context.userId };
}

export async function requireProfile() {
  const context = await requireUser();
  const { data } = await context.supabase.from('profiles').select('*').eq('id', context.userId).maybeSingle();
  if (!data) redirect('/onboarding');
  return { ...context, profile: data as Profile };
}

import { redirect } from 'next/navigation';
import { authContext } from '@/lib/auth';

export default async function Home() {
  const { supabase, userId } = await authContext();
  if (!userId) redirect('/login');
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  redirect(data ? '/hoy' : '/onboarding');
}

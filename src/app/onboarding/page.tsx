import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { OnboardingForm } from '@/components/forms/onboarding-form';

export default async function OnboardingPage() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (data) redirect('/hoy');
  return <main className="app-surface min-h-screen px-4 py-10"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[.25em] text-primary">GLM / Configuración</p><h1 className="font-display mt-3 text-5xl">Cuéntanos tu situación real</h1><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Estos datos definen qué puede recomendar GLM. Podrás actualizarlos después y ninguna estimación modificará tus mediciones.</p><div className="mt-10 rounded-[2rem] border bg-card p-6 shadow-xl sm:p-10"><OnboardingForm/></div></div></main>;
}

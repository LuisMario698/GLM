import { requireProfile } from '@/lib/auth';
import type { Exercise } from '@/types/domain';
import { PageHeader } from '@/components/layout/page-header';
import { ExerciseLibrary } from '@/components/exercises/exercise-library';

export default async function ExercisesPage() { const { supabase } = await requireProfile(); const { data } = await supabase.from('exercise_catalog').select('*').eq('active', true).order('name'); return <section className="space-y-8"><PageHeader eyebrow="Técnica aprobada" title="Ejercicios" description="Consulta ejecución, indicaciones, errores comunes y una fuente externa confiable. Detente si aparece dolor o mareo."/><ExerciseLibrary exercises={(data ?? []) as Exercise[]}/></section>; }

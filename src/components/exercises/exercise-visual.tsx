import Image from 'next/image';
import { cn } from '@/lib/utils';

const altBySlug: Record<string, string> = {
  'chair-squat': 'Sentadilla a silla: postura inicial de pie y posición final tocando la silla.',
  'bodyweight-squat': 'Sentadilla con peso corporal: postura inicial y posición inferior controlada.',
  'incline-pushup': 'Flexión inclinada: posición alta y posición baja apoyándose en un banco estable.',
  pushup: 'Flexión en el suelo: posición de plancha alta y descenso controlado.',
  'band-row': 'Remo con banda: brazos extendidos y codos llevados hacia atrás.',
  'dumbbell-row': 'Remo con mancuerna: posición inicial apoyada y mancuerna llevada hacia la cadera.',
  'glute-bridge': 'Puente de glúteos: cadera apoyada y cadera elevada con pies firmes.',
  'dead-bug': 'Dead bug: posición inicial con brazos y piernas elevados y extensión contralateral.',
  'front-plank': 'Plancha frontal: preparación con rodillas apoyadas y posición completa sobre antebrazos.',
  'brisk-walk': 'Caminata a paso cómodo mostrada en dos fases consecutivas del paso.',
};

export function ExerciseVisual({ slug, name, className, priority = false }: { slug: string; name?: string; className?: string; priority?: boolean }) {
  return <div className={cn('relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-[#eee6d8]', className)}>
    <Image
      src={`/images/exercises/${slug}.webp`}
      alt={altBySlug[slug] ?? `Ilustración de inicio y final para ${name ?? 'el ejercicio'}.`}
      fill
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 520px"
      className="object-cover"
    />
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-[#17201b]/55 to-transparent px-3 pb-2 pt-8 text-[10px] font-bold uppercase tracking-[.16em] text-white"><span>Inicio</span><span>Final</span></div>
  </div>;
}

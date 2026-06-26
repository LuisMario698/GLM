import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  equipmentLabel,
  levelLabel,
  movementLabel,
} from "@/lib/exercise-labels";
import type { Exercise } from "@/types/domain";
import { ExerciseVisual } from "@/components/exercises/exercise-visual";
import { Card } from "@/components/ui/card";
import { UrlTabs } from "@/components/ui/url-tabs";

export default async function ExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "tecnica" } = await searchParams;
  const { supabase } = await requireProfile();
  const { data } = await supabase
    .from("exercise_catalog")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();
  const exercise = data as Exercise;
  const tabs = [
    {
      value: "tecnica",
      label: "Técnica",
      href: `/ejercicios/${slug}?tab=tecnica`,
    },
    {
      value: "puntos",
      label: "Puntos clave",
      href: `/ejercicios/${slug}?tab=puntos`,
    },
    {
      value: "errores",
      label: "Errores",
      href: `/ejercicios/${slug}?tab=errores`,
    },
  ];
  return (
    <section className="space-y-7">
      <Link
        href="/ejercicios"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-secondary"
      >
        ← Volver al catálogo
      </Link>
      <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <ExerciseVisual slug={exercise.slug} name={exercise.name} priority />
          <p className="mt-4 text-xs font-bold uppercase tracking-[.2em] text-primary">
            {movementLabel(exercise.movement)} · {levelLabel(exercise.level)}
          </p>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl">
            {exercise.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Equipo: {exercise.equipment.map(equipmentLabel).join(", ")}
          </p>
        </div>
        <div>
          <UrlTabs
            items={tabs}
            active={tabs.some((item) => item.value === tab) ? tab : "tecnica"}
            label="Información del ejercicio"
          />
          <Card className="mt-4 min-h-64">
            {tab === "puntos" ? (
              <>
                <h2 className="font-display text-2xl">Puntos de control</h2>
                <ul className="mt-4 grid gap-3 text-sm">
                  {exercise.cues.map((cue) => (
                    <li
                      key={cue}
                      className="rounded-xl bg-emerald-50 p-3 text-emerald-950"
                    >
                      ✓ {cue}
                    </li>
                  ))}
                </ul>
              </>
            ) : tab === "errores" ? (
              <>
                <h2 className="font-display text-2xl">Errores comunes</h2>
                <ul className="mt-4 grid gap-3 text-sm">
                  {exercise.common_mistakes.map((mistake) => (
                    <li
                      key={mistake}
                      className="rounded-xl bg-red-50 p-3 text-red-950"
                    >
                      × {mistake}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl">Cómo hacerlo</h2>
                <ol className="mt-4 grid gap-3">
                  {exercise.instructions.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-6">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </Card>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          href={exercise.video_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-white"
        >
          Ver fuente en {exercise.video_source}
          <ExternalLink size={16} />
        </a>
        <Link
          href={`/guia?prompt=${encodeURIComponent(`Explícame por qué está incluido ${exercise.name} y qué debo recordar de su técnica`)}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-5 text-sm font-semibold"
        >
          <MessageCircle size={16} />
          Preguntar al guía
        </Link>
      </div>
    </section>
  );
}

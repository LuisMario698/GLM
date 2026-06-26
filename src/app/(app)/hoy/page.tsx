import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardPlus,
  Dumbbell,
  Pencil,
  Utensils,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { localISODate, mondayOf } from "@/lib/date";
import { effortSummary } from "@/lib/effort";
import { recommendToday } from "@/lib/recommendations/daily";
import type { DailyCheckin } from "@/types/domain";
import { DailyCheckinForm } from "@/components/forms/daily-checkin-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Modal } from "@/components/ui/modal";
import { StatusBanner } from "@/components/ui/feedback";

export default async function TodayPage() {
  const { supabase, userId, profile } = await requireProfile();
  const today = localISODate();
  const weekday = new Date(`${today}T12:00:00`).getDay() || 7;
  const [
    { data: checkin },
    { data: plan },
    { data: mealPlan },
    { data: latestMetric },
    { count: activityCount },
  ] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("profile_id", userId)
      .eq("recorded_on", today)
      .maybeSingle(),
    supabase
      .from("weekly_plans")
      .select("*")
      .eq("profile_id", userId)
      .eq("week_start", mondayOf(today))
      .maybeSingle(),
    supabase
      .from("meal_plans")
      .select("*")
      .eq("profile_id", userId)
      .eq("week_start", mondayOf(today))
      .maybeSingle(),
    supabase
      .from("body_metrics")
      .select("weight_kg,recorded_on")
      .eq("profile_id", userId)
      .not("weight_kg", "is", null)
      .order("recorded_on", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId)
      .gte("performed_on", mondayOf(today)),
  ]);
  const { data: session } = plan
    ? await supabase
        .from("planned_sessions")
        .select("*")
        .eq("plan_id", plan.id)
        .eq("day_index", weekday)
        .maybeSingle()
    : { data: null };
  const { data: meals } = mealPlan
    ? await supabase
        .from("meal_plan_items")
        .select("*,recipes(*)")
        .eq("meal_plan_id", mealPlan.id)
        .eq("planned_on", today)
        .order("slot")
    : { data: [] };
  const recommendation = checkin
    ? recommendToday(checkin as DailyCheckin)
    : null;
  return (
    <section className="space-y-7">
      <PageHeader
        eyebrow="Tu guía diaria"
        title={`Hola, ${profile.name.split(" ")[0]}`}
        description="Lo importante de hoy, sin predicciones ni datos inventados."
      />
      {!checkin ? (
        <Card className="overflow-hidden border-0 bg-[#17201b] text-white">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">
                Primer paso
              </p>
              <h2 className="font-display mt-3 text-3xl sm:text-4xl">
                ¿Cómo te sientes hoy?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                Cinco respuestas permiten conservar, reducir o pausar la sesión.
                Las señales de alerta siempre tienen prioridad.
              </p>
            </div>
            <Modal
              title="Cómo te sientes hoy"
              description="Responde según cómo te sientes ahora, no según cómo esperabas sentirte."
              trigger={
                <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-white">
                  <ClipboardPlus size={18} />
                  Responder ahora
                </button>
              }
            >
              <DailyCheckinForm />
            </Modal>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
          <StatusBanner
            tone={
              recommendation?.status === "paused"
                ? "danger"
                : recommendation?.status === "reduced"
                  ? "warning"
                  : "success"
            }
            title={recommendation?.title ?? "Evaluación lista"}
          >
            {recommendation?.rationale}
          </StatusBanner>
          <Modal
            title="Actualizar cómo me siento"
            description="La recomendación de hoy se volverá a calcular."
            trigger={
              <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border bg-card px-4 text-sm font-semibold">
                <Pencil size={16} />
                Editar cómo me siento
              </button>
            }
          >
            <DailyCheckinForm initial={checkin} />
          </Modal>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card
          className={
            session && recommendation?.status !== "paused"
              ? "border-secondary"
              : ""
          }
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Dumbbell size={18} />
            Sesión de hoy
          </div>
          {session ? (
            <>
              <h2 className="font-display mt-4 text-3xl">{session.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {session.duration_minutes} min · Dificultad recomendada:{" "}
                {effortSummary(session.target_rpe)} · {session.focus}
              </p>
              {recommendation?.status !== "paused" ? (
                <Link
                  href={`/sesion/${session.id}`}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-white"
                >
                  Abrir sesión <ArrowRight size={17} />
                </Link>
              ) : (
                <p className="mt-5 text-sm font-semibold text-red-700">
                  La sesión está pausada por tus respuestas de hoy.
                </p>
              )}
            </>
          ) : (
            <>
              <CalendarCheck className="mt-5 text-secondary" />
              <h2 className="font-display mt-3 text-2xl">
                Sin sesión programada
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Puedes descansar o registrar otra actividad real.
              </p>
              <Link
                href="/actividad?tab=registrar"
                className="mt-5 inline-flex min-h-11 items-center font-semibold text-secondary"
              >
                Registrar actividad <ArrowRight size={16} />
              </Link>
            </>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Utensils size={18} />
            Comidas de hoy
          </div>
          {meals?.length ? (
            <div className="mt-4 grid gap-2">
              {meals.map((meal) => (
                <div key={meal.id} className="rounded-xl bg-muted p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                    {slot(meal.slot)}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {meal.recipes.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Aún no hay menú.{" "}
              <Link
                className="font-semibold text-secondary"
                href="/alimentacion?tab=referencias"
              >
                Configurar alimentación
              </Link>
            </p>
          )}
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickStat
          label="Actividades esta semana"
          value={String(activityCount ?? 0)}
          href="/actividad?tab=historial"
        />
        <QuickStat
          label="Peso más reciente"
          value={
            latestMetric?.weight_kg
              ? `${latestMetric.weight_kg} kg`
              : "Sin registro"
          }
          href="/progreso?tab=registrar"
        />
        <QuickStat
          label="Plan semanal"
          value={plan ? `${plan.adjustment}` : "Sin generar"}
          href="/plan?tab=semana"
        />
      </div>
    </section>
  );
}
function slot(value: string) {
  return (
    (
      {
        breakfast: "Desayuno",
        lunch: "Comida",
        dinner: "Cena",
        snack: "Colación",
      } as Record<string, string>
    )[value] ?? value
  );
}
function QuickStat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="font-display mt-2 text-2xl capitalize">{value}</p>
    </Link>
  );
}

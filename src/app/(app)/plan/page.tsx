import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react";
import { generateWeeklyPlan } from "@/lib/actions/app";
import { requireProfile } from "@/lib/auth";
import { addDays, formatDate, localISODate, mondayOf } from "@/lib/date";
import { effortSummary } from "@/lib/effort";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { SubmitButton } from "@/components/forms/form-parts";
import { WeeklyCheckinForm } from "@/components/forms/weekly-checkin-form";
import { UrlTabs } from "@/components/ui/url-tabs";
import { EmptyState, StatusBanner } from "@/components/ui/feedback";

const sources = [
  [
    "WHO_PHYSICAL_ACTIVITY",
    "WHO: actividad física",
    "https://www.who.int/initiatives/behealthy/physical-activity",
  ],
  [
    "HHS_2018",
    "HHS: Physical Activity Guidelines",
    "https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
  ],
  [
    "ACSM_2026",
    "ACSM: entrenamiento de resistencia",
    "https://acsm.org/resistance-training-guidelines-update-2026/",
  ],
  [
    "CDC_SAFETY",
    "CDC: seguridad y condiciones crónicas",
    "https://www.cdc.gov/physical-activity-basics/guidelines/chronic-health-conditions-and-disabilities.html",
  ],
] as const;

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string }>;
}) {
  const params = await searchParams;
  const tab = ["semana", "revision", "fuentes"].includes(params.tab ?? "")
    ? params.tab!
    : "semana";
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(params.week ?? "")
    ? params.week!
    : mondayOf(localISODate());
  const { supabase, userId } = await requireProfile();
  const previousWeek = addDays(weekStart, -7);
  const [{ data: plan }, { data: weeklyCheckin }] = await Promise.all([
    supabase
      .from("weekly_plans")
      .select("*")
      .eq("profile_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle(),
    supabase
      .from("weekly_checkins")
      .select("*")
      .eq("profile_id", userId)
      .eq("week_start", previousWeek)
      .maybeSingle(),
  ]);
  const { data: sessions } = plan
    ? await supabase
        .from("planned_sessions")
        .select("*")
        .eq("plan_id", plan.id)
        .order("day_index")
    : { data: [] };
  const sessionIds = (sessions ?? []).map((session) => session.id);
  const { data: exercises } = sessionIds.length
    ? await supabase
        .from("planned_session_exercises")
        .select("*,exercise_catalog(name,slug)")
        .in("planned_session_id", sessionIds)
        .order("position")
    : { data: [] };
  const tabs = [
    {
      value: "semana",
      label: "Semana",
      href: `/plan?tab=semana&week=${weekStart}`,
      count: sessions?.length ?? 0,
    },
    {
      value: "revision",
      label: "Revisión",
      href: `/plan?tab=revision&week=${weekStart}`,
    },
    {
      value: "fuentes",
      label: "Fuentes",
      href: `/plan?tab=fuentes&week=${weekStart}`,
    },
  ];
  const today = localISODate();
  const todayIndex =
    today >= weekStart && today <= addDays(weekStart, 6)
      ? new Date(`${today}T12:00:00`).getDay() || 7
      : null;
  return (
    <section className="space-y-7">
      <PageHeader
        eyebrow="Semana adaptable"
        title="Tu plan"
        description="Sesiones basadas en tu disponibilidad, equipo, actividades completadas y cómo te sentiste; nunca en predicciones corporales."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UrlTabs items={tabs} active={tab} />
        <div className="flex items-center justify-between gap-2 rounded-full border bg-card p-1">
          <Link
            aria-label="Semana anterior"
            href={`/plan?tab=${tab}&week=${addDays(weekStart, -7)}`}
            className="grid size-10 place-items-center rounded-full hover:bg-muted"
          >
            <ChevronLeft size={18} />
          </Link>
          <span className="min-w-36 text-center text-xs font-bold uppercase tracking-wide">
            {formatDate(weekStart)} – {formatDate(addDays(weekStart, 6))}
          </span>
          <Link
            aria-label="Semana siguiente"
            href={`/plan?tab=${tab}&week=${addDays(weekStart, 7)}`}
            className="grid size-10 place-items-center rounded-full hover:bg-muted"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
      {tab === "revision" ? (
        <Card>
          <h2 className="font-display text-2xl">
            Revisión de la semana anterior
          </h2>
          <p className="mt-2 mb-5 text-sm leading-6 text-muted-foreground">
            Combina cómo te sentiste con las actividades realizadas y la
            dificultad que registraste. Una semana difícil no se interpreta como
            retroceso físico.
          </p>
          <WeeklyCheckinForm weekStart={previousWeek} initial={weeklyCheckin} />
        </Card>
      ) : tab === "fuentes" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {sources.map(([key, label, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.5rem] border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {key}
              </p>
              <h2 className="font-display mt-2 text-2xl">{label}</h2>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary">
                Abrir fuente <ExternalLink size={15} />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-[1.5rem] border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {plan ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    {adjustmentLabel(plan.adjustment)}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {plan.rationale}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-display text-2xl">Semana sin generar</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Usaremos tu evaluación y revisión más reciente.
                  </p>
                </>
              )}
            </div>
            <form action={generateWeeklyPlan} className="shrink-0">
              <input type="hidden" name="week_start" value={weekStart} />
              <SubmitButton>
                {plan ? "Recalcular" : "Generar semana"}
              </SubmitButton>
            </form>
          </div>
          {plan?.adjustment === "paused" && (
            <StatusBanner tone="danger" title="Plan pausado">
              {plan.rationale}
            </StatusBanner>
          )}
          {sessions?.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {sessions.map((session) => {
                const isToday = session.day_index === todayIndex;
                return (
                  <Card
                    key={session.id}
                    className={
                      isToday ? "border-secondary ring-2 ring-secondary/10" : ""
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                          Día {session.day_index} · {session.duration_minutes}{" "}
                          min · Dificultad {effortSummary(session.target_rpe)}
                        </p>
                        <h2 className="font-display mt-2 text-2xl">
                          {session.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {session.focus}
                        </p>
                      </div>
                      {isToday && (
                        <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase text-white">
                          Hoy
                        </span>
                      )}
                    </div>
                    <ol className="mt-4 grid gap-2">
                      {exercises
                        ?.filter(
                          (item) => item.planned_session_id === session.id,
                        )
                        .map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3 text-sm"
                          >
                            <span className="font-semibold">
                              {item.exercise_catalog.name}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {item.sets} series de {item.reps_min}–
                              {item.reps_max}
                            </span>
                          </li>
                        ))}
                    </ol>
                    <Link
                      href={`/sesion/${session.id}`}
                      className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-white"
                    >
                      <Play size={16} />
                      Abrir sesión ·{" "}
                      {formatDate(addDays(weekStart, session.day_index - 1))}
                    </Link>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Aún no hay sesiones"
              description="Genera esta semana cuando tu evaluación y equipo estén actualizados."
            />
          )}
        </>
      )}
    </section>
  );
}
function adjustmentLabel(value: string) {
  return (
    (
      {
        baseline: "Semana inicial",
        progress: "Aumento gradual",
        maintain: "Misma cantidad y dificultad",
        recovery: "Recuperación",
        paused: "Pausada por seguridad",
      } as Record<string, string>
    )[value] ?? value
  );
}

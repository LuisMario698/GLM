import Link from "next/link";
import { Activity, Apple, Camera, ClipboardList, Ruler } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { addDays, formatDate, localISODate } from "@/lib/date";
import {
  buildStatisticsSummary,
  normalizeStatisticsRange,
  type CompletedPlannedMealInput,
  type ConsumedPhotoMealInput,
  type MetricStatInput,
  type PendingPhotoMealInput,
  type WorkoutStatInput,
} from "@/lib/statistics";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/layout/page-header";
import { UrlTabs } from "@/components/ui/url-tabs";

type SearchParams = Promise<{ range?: string }>;

type RawMealItem = {
  planned_on: string;
  servings: number | string | null;
  recipes: { calories: number | string | null; protein_g: number | string | null } | { calories: number | string | null; protein_g: number | string | null }[] | null;
  meal_logs: { status: string }[] | null;
};

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const range = normalizeStatisticsRange(params.range);
  const today = localISODate();
  const startDate = addDays(today, range === "30d" ? -29 : -6);
  const nextDay = addDays(today, 1);
  const { supabase, userId } = await requireProfile();

  const [
    { data: workouts },
    { data: rawMealItems },
    { data: consumedPhotoMeals },
    { data: pendingPhotoMeals },
    { data: metrics },
    { data: latestMetric },
  ] = await Promise.all([
    supabase
      .from("workouts")
      .select("performed_on,duration_minutes,intensity_rpe")
      .eq("profile_id", userId)
      .gte("performed_on", startDate)
      .lte("performed_on", today),
    supabase
      .from("meal_plan_items")
      .select("planned_on,servings,recipes(calories,protein_g),meal_logs(status),meal_plans!inner(profile_id)")
      .eq("meal_plans.profile_id", userId)
      .gte("planned_on", startDate)
      .lte("planned_on", today),
    supabase
      .from("meals")
      .select("consumed_at,calories_estimated,protein_estimated,carbs_estimated,fat_estimated")
      .eq("profile_id", userId)
      .eq("status", "consumed")
      .gte("consumed_at", `${startDate}T00:00:00`)
      .lt("consumed_at", `${nextDay}T00:00:00`),
    supabase
      .from("meals")
      .select("analysis_status")
      .eq("profile_id", userId)
      .eq("status", "pending"),
    supabase
      .from("body_metrics")
      .select("recorded_on,weight_kg,height_cm,waist_cm")
      .eq("profile_id", userId)
      .gte("recorded_on", startDate)
      .lte("recorded_on", today),
    supabase
      .from("body_metrics")
      .select("recorded_on,weight_kg,height_cm,waist_cm")
      .eq("profile_id", userId)
      .order("recorded_on", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const completedPlannedMeals = normalizeCompletedMeals((rawMealItems ?? []) as RawMealItem[]);
  const summary = buildStatisticsSummary({
    range,
    today,
    workouts: (workouts ?? []) as WorkoutStatInput[],
    completedPlannedMeals,
    consumedPhotoMeals: (consumedPhotoMeals ?? []) as ConsumedPhotoMealInput[],
    pendingPhotoMeals: (pendingPhotoMeals ?? []) as PendingPhotoMealInput[],
    metrics: (metrics ?? []) as MetricStatInput[],
    latestMetric: (latestMetric ?? null) as MetricStatInput | null,
  });

  const rangeTabs = [
    { value: "7d", label: "7 días", href: "/estadisticas?range=7d" },
    { value: "30d", label: "30 días", href: "/estadisticas?range=30d" },
  ];

  return (
    <section className="space-y-7">
      <PageHeader
        eyebrow="Feedback real"
        title="Estadísticas"
        description="Resumen simple de lo que registraste. No predice cambios corporales ni inventa datos faltantes."
      />
      <UrlTabs items={rangeTabs} active={range} label="Rango de estadísticas" />

      {!summary.hasAnyData ? <StatsEmptyState /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Actividad"
          value={`${summary.activity.totalMinutes} min`}
          detail={`${summary.activity.workouts} registros · ${summary.activity.activeDays} días activos`}
          accent="secondary"
        />
        <StatCard
          icon={Apple}
          label="Alimentación"
          value={`${summary.nutrition.calories} cal`}
          detail={`${summary.nutrition.completedPlannedMeals + summary.nutrition.consumedPhotoMeals} comidas consumidas`}
          accent="primary"
        />
        <StatCard
          icon={Ruler}
          label="Progreso"
          value={formatMetric(summary.progress.latest)}
          detail={`${summary.progress.measurements} mediciones en el rango`}
          accent="dark"
        />
        <StatCard
          icon={Camera}
          label="Pendientes"
          value={`${summary.pending.photoMeals}`}
          detail={`${summary.pending.failedAnalysis} con análisis fallido`}
          accent="warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl">Día por día</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Actividad y energía estimada por día registrado.
              </p>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.days.map((day) => (
              <DailyRow
                key={day.date}
                date={day.date}
                minutes={day.activityMinutes}
                calories={day.calories}
                maxMinutes={summary.maxima.activityMinutes}
                maxCalories={summary.maxima.calories}
              />
            ))}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card>
            <h2 className="font-display text-2xl">Nutrición estimada</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Suma de comidas planeadas marcadas como comidas y fotos marcadas como consumidas.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Macro label="Proteína" value={`${summary.nutrition.protein} g`} />
              <Macro label="Carbos" value={`${summary.nutrition.carbs} g`} />
              <Macro label="Grasa" value={`${summary.nutrition.fat} g`} />
              <Macro label="Días con comida" value={`${summary.nutrition.foodDays}`} />
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-2xl">Acciones rápidas</h2>
            <div className="mt-4 grid gap-2">
              <QuickLink href="/actividad?tab=registrar" label="Registrar actividad" />
              <QuickLink href="/alimentacion?tab=comidas" label="Agregar comida con foto" />
              <QuickLink href="/progreso?tab=registrar" label="Registrar medición" />
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl">Lectura rápida</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              En este rango tuviste {summary.activity.activeDays} días con actividad y{" "}
              {summary.nutrition.foodDays} días con comida registrada. La dificultad promedio fue{" "}
              {summary.activity.averageDifficulty ? `${summary.activity.averageDifficulty}/10` : "sin datos"}.
            </p>
          </div>
          <ClipboardList className="hidden text-secondary lg:block" size={36} />
        </div>
      </Card>
    </section>
  );
}

function normalizeCompletedMeals(items: RawMealItem[]): CompletedPlannedMealInput[] {
  return items
    .filter((item) => item.meal_logs?.some((log) => log.status === "completed"))
    .map((item) => {
      const recipe = Array.isArray(item.recipes) ? item.recipes[0] : item.recipes;
      return {
        planned_on: item.planned_on,
        servings: item.servings,
        calories: recipe?.calories ?? 0,
        protein_g: recipe?.protein_g ?? 0,
      };
    });
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  detail: string;
  accent: "primary" | "secondary" | "dark" | "warning";
}) {
  const tone = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    dark: "bg-[#17201b] text-white",
    warning: "bg-amber-100 text-amber-900",
  }[accent];
  return (
    <Card>
      <div className={`grid size-11 place-items-center rounded-full ${tone}`}>
        <Icon size={20} />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-2 text-4xl leading-none">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </Card>
  );
}

function DailyRow({
  date,
  minutes,
  calories,
  maxMinutes,
  maxCalories,
}: {
  date: string;
  minutes: number;
  calories: number;
  maxMinutes: number;
  maxCalories: number;
}) {
  const minutesWidth = Math.max(3, Math.round((minutes / maxMinutes) * 100));
  const caloriesWidth = Math.max(3, Math.round((calories / maxCalories) * 100));
  return (
    <div className="grid gap-2 rounded-2xl border bg-white/75 p-3 sm:grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] sm:items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          {weekday(date)}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
      </div>
      <div className="grid gap-2">
        <Bar label="Actividad" value={minutes ? `${Math.round(minutes)} min` : "0 min"} width={minutesWidth} color="bg-secondary" />
        <Bar label="Comida" value={calories ? `${Math.round(calories)} cal` : "0 cal"} width={caloriesWidth} color="bg-primary" />
      </div>
      <p className="text-right text-xs text-muted-foreground">
        {minutes || calories ? "registrado" : "sin datos"}
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[4.8rem_minmax(0,1fr)_4.4rem] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-muted">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between rounded-xl border bg-white px-4 text-sm font-semibold transition hover:bg-muted"
    >
      {label}
      <span aria-hidden>-&gt;</span>
    </Link>
  );
}

function StatsEmptyState() {
  return (
    <EmptyState
      title="Todavía no hay estadísticas"
      description="Registra una actividad, una comida o una medición para empezar a ver feedback semanal."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="font-semibold text-secondary" href="/actividad?tab=registrar">
            Registrar actividad
          </Link>
          <Link className="font-semibold text-secondary" href="/alimentacion?tab=comidas">
            Agregar comida
          </Link>
        </div>
      }
    />
  );
}

function formatMetric(metric: MetricStatInput | null) {
  if (!metric) return "Sin registro";
  if (metric.weight_kg) return `${Number(metric.weight_kg)} kg`;
  if (metric.waist_cm) return `${Number(metric.waist_cm)} cm cintura`;
  if (metric.height_cm) return `${Number(metric.height_cm)} cm`;
  return "Registrado";
}

function weekday(date: string) {
  return new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(
    new Date(`${date}T12:00:00`),
  );
}

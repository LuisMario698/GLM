import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { localISODate } from "@/lib/date";
import { recommendToday } from "@/lib/recommendations/daily";
import type { DailyCheckin } from "@/types/domain";
import { SessionTimer } from "@/components/session/session-timer";
import { Card } from "@/components/ui/card";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireProfile();
  const [{ data: session }, { data: checkin }, { data: run }] =
    await Promise.all([
      supabase
        .from("planned_sessions")
        .select("*,weekly_plans!inner(profile_id)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("daily_checkins")
        .select("*")
        .eq("profile_id", userId)
        .eq("recorded_on", localISODate())
        .maybeSingle(),
      supabase
        .from("session_runs")
        .select("*")
        .eq("profile_id", userId)
        .eq("planned_session_id", id)
        .in("status", ["active", "paused"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
  if (!session || session.weekly_plans.profile_id !== userId) notFound();
  const recommendation = checkin
    ? recommendToday(checkin as DailyCheckin)
    : null;
  const { data: items } = await supabase
    .from("planned_session_exercises")
    .select("*,exercise_catalog(name,slug,movement,instructions)")
    .eq("planned_session_id", id)
    .order("position");
  const { data: logs } = run
    ? await supabase
        .from("session_set_logs")
        .select("*")
        .eq("session_run_id", run.id)
        .order("completed_at")
    : { data: [] };
  if (!recommendation)
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card>
          <h1 className="font-display text-4xl">
            Cuéntanos primero cómo te sientes
          </h1>
          <p className="mt-3 text-muted-foreground">
            GLM necesita conocer tu preparación de hoy antes de iniciar una
            sesión.
          </p>
        </Card>
      </div>
    );
  if (recommendation.status === "paused")
    return (
      <div className="mx-auto max-w-xl p-6">
        <Card className="border-red-300 bg-red-50">
          <h1 className="font-display text-4xl">Sesión pausada</h1>
          <p className="mt-3 leading-7">{recommendation.rationale}</p>
        </Card>
      </div>
    );
  const adjusted = (items ?? []).map((item) =>
    recommendation.status === "reduced"
      ? { ...item, sets: Math.max(1, Math.round(item.sets * 0.75)) }
      : item,
  );
  return (
    <SessionTimer
      sessionId={id}
      sessionTitle={session.title}
      items={adjusted}
      initialRun={run}
      initialLogs={logs ?? []}
    />
  );
}

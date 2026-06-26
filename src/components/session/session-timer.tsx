"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CirclePause,
  CirclePlay,
  FastForward,
  RotateCcw,
  Square,
} from "lucide-react";
import {
  completeSet,
  finishSession,
  skipExercise,
  startSession,
  updateSessionTimer,
} from "@/lib/actions/app";
import { effortOptions } from "@/lib/effort";
import { Button } from "@/components/ui/button";
import { ExerciseVisual } from "@/components/exercises/exercise-visual";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type Item = {
  id: string;
  exercise_id: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  note: string | null;
  exercise_catalog: {
    name: string;
    slug: string;
    movement: string;
    instructions: string[];
  };
};
type Run = {
  id: string;
  status: "active" | "paused";
  elapsed_seconds: number;
  current_exercise: number;
  current_set: number;
  phase: "exercise" | "rest";
  phase_ends_at: string | null;
};
type SetLog = {
  id: string;
  planned_session_exercise_id: string;
  set_number: number;
  status: "completed" | "skipped";
  reps_completed: number | null;
  rpe: number | null;
};
type WakeLockSentinelLike = { release: () => Promise<void> };

export function SessionTimer({
  sessionId,
  sessionTitle,
  items,
  initialRun,
  initialLogs,
}: {
  sessionId: string;
  sessionTitle: string;
  items: Item[];
  initialRun: Run | null;
  initialLogs: SetLog[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [started, setStarted] = useState(Boolean(initialRun));
  const [runId, setRunId] = useState(initialRun?.id ?? "");
  const [running, setRunning] = useState(initialRun?.status === "active");
  const [elapsed, setElapsed] = useState(initialRun?.elapsed_seconds ?? 0);
  const [index, setIndex] = useState(initialRun?.current_exercise ?? 0);
  const [setNumber, setSetNumber] = useState(initialRun?.current_set ?? 1);
  const [phase, setPhase] = useState<"exercise" | "rest">(
    initialRun?.phase ?? "exercise",
  );
  const [restLeft, setRestLeft] = useState(0);
  const [reps, setReps] = useState(
    items[initialRun?.current_exercise ?? 0]?.reps_max ?? 8,
  );
  const [setRpe, setSetRpe] = useState(7);
  const [summaryRpe, setSummaryRpe] = useState(7);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(
    initialLogs.filter((log) => log.status === "completed").length,
  );
  const [sessionComplete, setSessionComplete] = useState(false);
  const current = items[Math.min(index, Math.max(0, items.length - 1))];
  const totalSets = items.reduce((sum, item) => sum + item.sets, 0);
  const progress = totalSets
    ? Math.min(100, Math.round((completed / totalSets) * 100))
    : 0;
  const persist = useEffectEvent(async () => {
    if (runId)
      await updateSessionTimer({
        id: runId,
        status: running ? "active" : "paused",
        elapsedSeconds: elapsed,
        currentExercise: index,
        currentSet: setNumber,
        phase,
        phaseEndsAt: restLeft
          ? new Date(Date.now() + restLeft * 1000).toISOString()
          : null,
      });
  });
  useEffect(() => {
    if (!initialRun?.phase_ends_at) return;
    const timer = window.setTimeout(
      () =>
        setRestLeft(
          Math.max(
            0,
            Math.ceil(
              (new Date(initialRun.phase_ends_at as string).getTime() -
                Date.now()) /
                1000,
            ),
          ),
        ),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [initialRun?.phase_ends_at]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setElapsed((value) => value + 1);
      setRestLeft((value) => {
        if (value === 1) setPhase("exercise");
        return value > 0 ? value - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => void persist(), 15000);
    return () => clearInterval(timer);
  }, [started]);
  useEffect(() => {
    if (!running || !started || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinelLike | undefined;
    void (
      navigator as Navigator & {
        wakeLock: {
          request: (type: "screen") => Promise<WakeLockSentinelLike>;
        };
      }
    ).wakeLock
      .request("screen")
      .then((value) => {
        lock = value;
      })
      .catch(() => undefined);
    return () => {
      void lock?.release();
    };
  }, [running, started]);
  if (!current)
    return (
      <p className="p-6">No hay ejercicios configurados para esta sesión.</p>
    );
  function begin() {
    startTransition(async () => {
      const result = await startSession(sessionId);
      if (result.ok) {
        setRunId(result.data.id);
        setStarted(true);
        setRunning(true);
      } else setMessage(result.error);
    });
  }
  function togglePause() {
    const next = !running;
    setRunning(next);
    if (runId)
      void updateSessionTimer({
        id: runId,
        status: next ? "active" : "paused",
        elapsedSeconds: elapsed,
        currentExercise: index,
        currentSet: setNumber,
        phase,
        phaseEndsAt: restLeft
          ? new Date(Date.now() + restLeft * 1000).toISOString()
          : null,
      });
  }
  function recordSet() {
    startTransition(async () => {
      if (!runId) return;
      const result = await completeSet({
        runId,
        plannedExerciseId: current.id,
        setNumber,
        reps,
        rpe: setRpe,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setCompleted((value) => value + 1);
      setIndex(result.data.nextExercise);
      setSetNumber(result.data.nextSet);
      setRestLeft(result.data.restSeconds);
      setPhase(result.data.restSeconds ? "rest" : "exercise");
      setSessionComplete(result.data.sessionComplete);
      const next = items[result.data.nextExercise];
      setReps(next?.reps_max ?? current.reps_max);
    });
  }
  function skip() {
    startTransition(async () => {
      if (!runId) return;
      const result = await skipExercise({
        runId,
        plannedExerciseId: current.id,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setIndex(result.data.nextExercise);
      setSetNumber(1);
      setPhase("exercise");
      setRestLeft(0);
      setSessionComplete(result.data.sessionComplete);
      setReps(items[result.data.nextExercise]?.reps_max ?? current.reps_max);
    });
  }
  function finish() {
    startTransition(async () => {
      if (!runId) return;
      const result = await finishSession({
        id: runId,
        elapsedSeconds: elapsed,
        rpe: summaryRpe,
        notes,
      });
      if (result.ok) router.push("/actividad?tab=historial");
      else setMessage(result.error);
    });
  }
  function leave() {
    if (
      !started ||
      window.confirm(
        "¿Quieres salir? El tiempo y avance se guardarán para continuar después.",
      )
    ) {
      if (started && runId)
        void updateSessionTimer({
          id: runId,
          status: running ? "active" : "paused",
          elapsedSeconds: elapsed,
          currentExercise: index,
          currentSet: setNumber,
          phase,
          phaseEndsAt: restLeft
            ? new Date(Date.now() + restLeft * 1000).toISOString()
            : null,
        });
      router.push("/plan?tab=semana");
    }
  }
  if (!started)
    return (
      <main className="mx-auto grid min-h-dvh max-w-5xl content-center gap-6 px-4 py-8 sm:px-7">
        <button
          onClick={leave}
          className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-secondary"
        >
          <ArrowLeft size={17} />
          Volver al plan
        </button>
        <div className="grid overflow-hidden rounded-[2rem] border bg-card shadow-xl lg:grid-cols-[1.1fr_.9fr]">
          <ExerciseVisual
            slug={current.exercise_catalog.slug}
            name={current.exercise_catalog.name}
            priority
            className="rounded-none"
          />
          <div className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">
              Sesión preparada
            </p>
            <h1 className="font-display mt-3 text-4xl">{sessionTitle}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {items.length} ejercicios · {totalSets} series planeadas. Una
              serie es un grupo de repeticiones seguido de un descanso. El
              temporizador comenzará sólo cuando tú lo indiques.
            </p>
            <Button className="mt-7 w-full" onClick={begin} disabled={pending}>
              <CirclePlay size={19} />
              {pending ? "Preparando…" : "Comenzar sesión"}
            </Button>
            {message && <p className="mt-3 text-sm text-red-700">{message}</p>}
          </div>
        </div>
      </main>
    );
  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-4 pt-4 pb-40 sm:px-7">
      <header className="flex items-center justify-between gap-4">
        <button
          onClick={leave}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft size={17} />
          Salir
        </button>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold">{clock(elapsed)}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Tiempo total
          </p>
        </div>
      </header>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-muted-foreground">
        {completed} de {totalSets} series confirmadas
      </p>
      {sessionComplete ? (
        <div className="mx-auto mt-10 max-w-2xl rounded-[2rem] border bg-card p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
            <Check size={28} />
          </span>
          <h1 className="font-display mt-5 text-4xl">Sesión completada</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Indica qué tan difícil se sintió toda la sesión y añade sólo las
            notas que quieras conservar.
          </p>
          <div className="mt-6 grid gap-4 text-left sm:grid-cols-[240px_1fr]">
            <label className="grid gap-2 text-sm font-semibold">
              Dificultad general
              <Select
                value={summaryRpe}
                onChange={(event) => setSummaryRpe(Number(event.target.value))}
              >
                {effortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Notas
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </div>
          <Button className="mt-6 w-full" onClick={finish} disabled={pending}>
            <Square size={17} />
            {pending ? "Guardando…" : "Finalizar y registrar"}
          </Button>
        </div>
      ) : phase === "rest" ? (
        <div className="grid min-h-[60dvh] place-items-center text-center">
          <div>
            <RotateCcw className="mx-auto text-primary" size={38} />
            <p className="font-display mt-4 text-7xl">{restLeft}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              segundos de descanso
            </p>
            <button
              onClick={() => {
                setRestLeft(0);
                setPhase("exercise");
              }}
              className="mt-6 min-h-11 rounded-full border bg-card px-5 text-sm font-semibold"
            >
              Omitir descanso
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <ExerciseVisual
            slug={current.exercise_catalog.slug}
            name={current.exercise_catalog.name}
            priority
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">
              Ejercicio {index + 1} de {items.length} · Serie {setNumber} de{" "}
              {current.sets}
            </p>
            <h1 className="font-display mt-2 text-4xl sm:text-5xl">
              {current.exercise_catalog.name}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Objetivo: {current.reps_min}–{current.reps_max}{" "}
              {current.exercise_catalog.movement === "cardio"
                ? "minutos"
                : "repeticiones"}{" "}
              · descanso {current.rest_seconds}s
            </p>
            {current.note && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                {current.note}
              </p>
            )}
            <ol className="mt-5 grid gap-2 text-sm leading-6">
              {current.exercise_catalog.instructions.map((step) => (
                <li key={step}>• {step}</li>
              ))}
            </ol>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                {current.exercise_catalog.movement === "cardio"
                  ? "Minutos"
                  : "Repeticiones"}{" "}
                reales
                <Input
                  type="number"
                  min="0"
                  max="500"
                  value={reps}
                  onChange={(event) => setReps(Number(event.target.value))}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                ¿Qué tan difícil fue esta serie?
                <Select
                  value={setRpe}
                  onChange={(event) => setSetRpe(Number(event.target.value))}
                >
                  {effortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Usa 1 si fue casi sin esfuerzo, 5 si fue moderado y 10 sólo si fue
              tu máximo esfuerzo posible.
            </p>
          </div>
        </div>
      )}
      {!sessionComplete && phase === "exercise" && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-4 pt-3 shadow-[0_-12px_35px_rgba(23,32,27,.1)] backdrop-blur">
          <div className="mx-auto flex max-w-4xl gap-2">
            <Button variant="ghost" onClick={togglePause} className="px-4">
              {running ? <CirclePause size={18} /> : <CirclePlay size={18} />}
              <span className="hidden sm:inline">
                {running ? "Pausar" : "Continuar"}
              </span>
            </Button>
            <Button
              onClick={recordSet}
              disabled={pending || !running}
              className="flex-1"
            >
              <Check size={18} />
              {pending ? "Guardando…" : "Completar serie"}
            </Button>
            <Modal
              title="Omitir ejercicio"
              description="Las series restantes quedarán registradas como omitidas, no como realizadas."
              trigger={
                <Button variant="ghost" className="px-4">
                  <FastForward size={18} />
                  <span className="hidden sm:inline">Omitir</span>
                </Button>
              }
            >
              <Button
                variant="danger"
                onClick={skip}
                disabled={pending}
                className="w-full"
              >
                Confirmar omisión
              </Button>
            </Modal>
          </div>
        </div>
      )}
      {message && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {message}
        </p>
      )}
    </main>
  );
}
function clock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

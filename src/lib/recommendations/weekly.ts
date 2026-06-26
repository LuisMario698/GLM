import type {
  Exercise,
  PlannedExerciseDraft,
  PlanAdjustment,
  TrainingProfile,
  WeeklyPlanDraft,
} from "@/types/domain";

export type WeeklyInput = {
  training: TrainingProfile;
  exercises: Exercise[];
  previousPlanned: number;
  previousCompleted: number;
  averageRpe: number | null;
  checkin: {
    energy: number;
    recovery: number;
    soreness: number;
    pain: boolean;
  } | null;
};

export function generateWeeklyPlan(input: WeeklyInput): WeeklyPlanDraft {
  if (
    input.training.current_pain ||
    input.checkin?.pain ||
    (input.training.has_medical_condition &&
      !input.training.professional_clearance) ||
    (input.training.limitations && !input.training.professional_clearance)
  ) {
    return {
      adjustment: "paused",
      sessions: [],
      sourceKeys: ["CDC_SAFETY"],
      rationale:
        "La rutina está pausada porque existe dolor o una condición/limitación sin autorización profesional. GLM no prescribe actividad en esta situación.",
    };
  }

  const adjustment = chooseAdjustment(input);
  const days = distributions[input.training.available_days] ?? distributions[3];
  const sessions = days.map((day, index) => {
    const cardio = index % 3 === 1;
    const selected = cardio
      ? selectCardio(input.exercises)
      : selectStrength(input.training, input.exercises);
    const recovery = adjustment === "recovery";
    return {
      day_index: day,
      title: cardio
        ? "Caminata guiada"
        : `Fuerza de cuerpo completo ${index + 1}`,
      focus: cardio ? "Mejorar resistencia y respiración" : "Fuerza general",
      duration_minutes: Math.max(
        15,
        Math.round(input.training.session_minutes * (recovery ? 0.75 : 1)),
      ),
      target_rpe: recovery ? 5 : cardio ? 5 : 7,
      exercises: selected.map((exercise, position) =>
        prescribe(exercise, position, adjustment),
      ),
    };
  });

  return {
    adjustment,
    sessions,
    sourceKeys: ["WHO_PHYSICAL_ACTIVITY", "HHS_2018", "ACSM_2026"],
    rationale: rationale(input, adjustment),
  };
}

function chooseAdjustment(input: WeeklyInput): PlanAdjustment {
  if (!input.previousPlanned) return "baseline";
  const adherence = input.previousCompleted / input.previousPlanned;
  if (
    adherence < 0.5 ||
    (input.averageRpe ?? 0) > 8 ||
    (input.checkin &&
      (input.checkin.recovery <= 2 ||
        input.checkin.energy <= 2 ||
        input.checkin.soreness >= 4))
  )
    return "recovery";
  if (
    adherence >= 0.8 &&
    input.averageRpe !== null &&
    input.averageRpe <= 8 &&
    input.checkin &&
    input.checkin.recovery >= 3 &&
    input.checkin.soreness <= 3
  )
    return "progress";
  return "maintain";
}

function compatible(training: TrainingProfile, exercise: Exercise) {
  return (
    exercise.equipment.includes("none") ||
    exercise.equipment.some((item) => training.equipment.includes(item))
  );
}

function selectStrength(training: TrainingProfile, catalog: Exercise[]) {
  const available = catalog.filter((exercise) =>
    compatible(training, exercise),
  );
  return ["squat", "push", "pull", "hinge", "core"]
    .map((movement) =>
      available.find((exercise) => exercise.movement === movement),
    )
    .filter((exercise): exercise is Exercise => Boolean(exercise));
}

function selectCardio(catalog: Exercise[]) {
  const walk = catalog.find((exercise) => exercise.movement === "cardio");
  return walk ? [walk] : [];
}

function prescribe(
  exercise: Exercise,
  position: number,
  adjustment: PlanAdjustment,
): PlannedExerciseDraft {
  if (exercise.movement === "cardio")
    return {
      exercise_id: exercise.id,
      name: exercise.name,
      position,
      sets: 1,
      reps_min: 20,
      reps_max: 30,
      rest_seconds: 60,
      note: "Camina a un ritmo que te permita hablar sin quedarte sin aire.",
    };
  const recovery = adjustment === "recovery";
  const progress = adjustment === "progress";
  return {
    exercise_id: exercise.id,
    name: exercise.name,
    position,
    sets: recovery ? 2 : 3,
    reps_min: 8,
    reps_max: progress ? 13 : 12,
    rest_seconds: exercise.movement === "core" ? 45 : 75,
    note: progress
      ? "Aumenta como máximo una repetición por serie; no cambies otra variable."
      : undefined,
  };
}

function rationale(input: WeeklyInput, adjustment: PlanAdjustment) {
  if (adjustment === "baseline")
    return "Semana inicial creada con tu disponibilidad, experiencia y equipo. La cantidad de ejercicio es moderada para observar cómo respondes.";
  const adherence = input.previousPlanned
    ? Math.round((input.previousCompleted / input.previousPlanned) * 100)
    : 0;
  const context = `Completaste ${adherence} % de las sesiones planeadas. Dificultad promedio: ${input.averageRpe?.toFixed(1) ?? "sin dato"} de 10.`;
  if (adjustment === "progress")
    return `${context} La siguiente semana aumenta una sola cosa y nunca más de 10 %.`;
  if (adjustment === "recovery")
    return `${context} La cantidad de ejercicio baja 25 % porque tu cumplimiento, dificultad o recuperación indican que conviene hacer menos esta semana.`;
  return `${context} Se conserva la misma cantidad y dificultad porque no hay información suficiente para aumentarlas o reducirlas.`;
}

const distributions: Record<number, number[]> = {
  2: [2, 5],
  3: [1, 3, 6],
  4: [1, 2, 4, 6],
  5: [1, 2, 4, 5, 7],
  6: [1, 2, 3, 5, 6, 7],
};

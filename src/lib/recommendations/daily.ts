import type { DailyCheckin, RecommendationStatus } from "@/types/domain";

export type DailyRecommendation = {
  status: RecommendationStatus;
  volumeMultiplier: number;
  rpeCap: number;
  title: string;
  rationale: string;
  urgent: boolean;
};

export function recommendToday(checkin: DailyCheckin): DailyRecommendation {
  if (checkin.chest_pain || checkin.dizziness) {
    return {
      status: "paused",
      volumeMultiplier: 0,
      rpeCap: 0,
      urgent: true,
      title: "Pausa la actividad",
      rationale:
        "Reportaste una señal de alerta. No inicies la sesión. Busca atención médica; si el síntoma es intenso o repentino, utiliza los servicios de emergencia de tu localidad.",
    };
  }
  if (checkin.pain) {
    return {
      status: "paused",
      volumeMultiplier: 0,
      rpeCap: 0,
      urgent: false,
      title: "Entrenamiento pausado",
      rationale:
        "Reportaste dolor actual. GLM no adapta ni prescribe ejercicios ante dolor; consulta a un profesional antes de continuar.",
    };
  }
  const strained =
    checkin.energy <= 2 ||
    checkin.sleep_quality <= 2 ||
    checkin.soreness >= 4 ||
    checkin.stress >= 4 ||
    checkin.readiness <= 2;
  if (strained) {
    return {
      status: "reduced",
      volumeMultiplier: 0.75,
      rpeCap: 6,
      urgent: false,
      title: "Sesión reducida",
      rationale:
        "Tus respuestas indican que hoy te has recuperado menos. Realiza 25 % menos series, mantén una dificultad moderada de 6/10 o menor y detente si aparece dolor, mareo o malestar.",
    };
  }
  return {
    status: "normal",
    volumeMultiplier: 1,
    rpeCap: 8,
    urgent: false,
    title: "Sesión según el plan",
    rationale:
      "No se identificaron señales para reducir la sesión. Respeta la técnica, los descansos y la dificultad recomendada.",
  };
}

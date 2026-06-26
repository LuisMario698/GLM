const movementLabels: Record<string, string> = {
  squat: "Piernas y sentadillas",
  push: "Pecho, hombros y brazos",
  pull: "Espalda y brazos",
  hinge: "Cadera y glúteos",
  core: "Abdomen y estabilidad",
  cardio: "Resistencia",
};

const levelLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const equipmentLabels: Record<string, string> = {
  none: "Sin equipo",
  bands: "Bandas elásticas",
  dumbbells: "Mancuernas",
  gym: "Equipo de gimnasio",
};

export function movementLabel(value: string) {
  return movementLabels[value] ?? value;
}

export function levelLabel(value: string) {
  return levelLabels[value] ?? value;
}

export function equipmentLabel(value: string) {
  return equipmentLabels[value] ?? value;
}

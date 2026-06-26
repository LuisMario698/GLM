export const effortOptions = [
  { value: 1, label: "1 · Casi sin esfuerzo" },
  { value: 2, label: "2 · Muy suave" },
  { value: 3, label: "3 · Suave" },
  { value: 4, label: "4 · Cómodo" },
  { value: 5, label: "5 · Moderado" },
  { value: 6, label: "6 · Moderado, requiere atención" },
  { value: 7, label: "7 · Difícil pero controlable" },
  { value: 8, label: "8 · Difícil, pocas repeticiones posibles" },
  { value: 9, label: "9 · Muy difícil" },
  { value: 10, label: "10 · Esfuerzo máximo" },
] as const;

export function effortLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return "Sin registrar";
  if (value <= 2) return "Muy suave";
  if (value <= 4) return "Suave";
  if (value <= 6) return "Moderado";
  if (value <= 8) return "Difícil pero controlable";
  if (value < 10) return "Muy difícil";
  return "Esfuerzo máximo";
}

export function effortSummary(value: number | null | undefined) {
  if (value === null || value === undefined) return "Sin dificultad registrada";
  return `${value}/10 · ${effortLabel(value)}`;
}

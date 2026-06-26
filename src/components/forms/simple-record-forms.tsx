"use client";

import { useActionState } from "react";
import { saveActivity, saveMetric } from "@/lib/actions/app";
import { initialFormState } from "@/lib/actions/state";
import { localISODate } from "@/lib/date";
import { effortOptions } from "@/lib/effort";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "./form-parts";

export function ActivityForm() {
  const [state, action] = useActionState(saveActivity, initialFormState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold">
        Fecha
        <Input
          name="performed_on"
          type="date"
          defaultValue={localISODate()}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Tipo
        <Select name="activity_type" defaultValue="walking">
          <option value="walking">Caminata</option>
          <option value="strength">Fuerza</option>
          <option value="running">Carrera</option>
          <option value="cycling">Ciclismo</option>
          <option value="sport">Deporte</option>
          <option value="mobility">Movilidad</option>
          <option value="other">Otra</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Actividad
        <Input name="title" placeholder="Ej. Caminata por el parque" required />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Duración real (min)
        <Input
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        ¿Qué tan difícil se sintió? (opcional)
        <Select name="intensity_rpe" defaultValue="">
          <option value="">No quiero indicarlo</option>
          {effortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <span className="font-normal leading-5 text-muted-foreground">
          1 significa casi sin esfuerzo y 10 es tu máximo esfuerzo.
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
        Notas
        <Textarea name="notes" />
      </label>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <div>
        <SubmitButton>Registrar actividad</SubmitButton>
      </div>
    </form>
  );
}
export function MetricForm() {
  const [state, action] = useActionState(saveMetric, initialFormState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-2 text-sm font-semibold">
        Fecha
        <Input
          name="recorded_on"
          type="date"
          defaultValue={localISODate()}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Peso (kg)
        <Input name="weight_kg" type="number" min="30" max="350" step="0.1" />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Altura (cm)
        <Input name="height_cm" type="number" min="100" max="250" step="0.1" />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Cintura (cm)
        <Input name="waist_cm" type="number" min="30" max="250" step="0.1" />
      </label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2 lg:col-span-4">
        Notas
        <Input name="notes" />
      </label>
      <div className="sm:col-span-2 lg:col-span-4">
        <FormMessage state={state} />
      </div>
      <div>
        <SubmitButton>Guardar medición</SubmitButton>
      </div>
    </form>
  );
}

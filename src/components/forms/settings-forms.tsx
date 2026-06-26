"use client";

import { useActionState } from "react";
import {
  updateNutritionSettings,
  updateTrainingSettings,
} from "@/lib/actions/app";
import { initialFormState } from "@/lib/actions/state";
import type { NutritionProfile, TrainingProfile } from "@/types/domain";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "./form-parts";

export function TrainingSettingsForm({ value }: { value: TrainingProfile }) {
  const [state, action] = useActionState(
    updateTrainingSettings,
    initialFormState,
  );
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Choice name="experience" label="Experiencia" value={value.experience}>
        <option value="beginner">Principiante</option>
        <option value="intermediate">Intermedia</option>
        <option value="advanced">Avanzada</option>
      </Choice>
      <Choice
        name="current_activity"
        label="Actividad habitual"
        value={value.current_activity}
      >
        <option value="inactive">Poca</option>
        <option value="light">Ligera</option>
        <option value="regular">Regular</option>
        <option value="very_active">Muy activa</option>
      </Choice>
      <Field
        name="available_days"
        label="Días disponibles"
        type="number"
        min="2"
        max="6"
        defaultValue={value.available_days}
      />
      <Field
        name="session_minutes"
        label="Minutos por sesión"
        type="number"
        min="15"
        max="120"
        defaultValue={value.session_minutes}
      />
      <div className="sm:col-span-2">
        <p className="mb-2 text-sm font-semibold">Equipo</p>
        {[
          ["none", "Sin equipo"],
          ["bands", "Bandas"],
          ["dumbbells", "Mancuernas"],
          ["gym", "Gimnasio"],
        ].map(([key, label]) => (
          <label key={key} className="mr-4 text-sm">
            <input
              className="mr-2"
              name="equipment"
              value={key}
              type="checkbox"
              defaultChecked={value.equipment.includes(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
        Limitaciones
        <Textarea name="limitations" defaultValue={value.limitations ?? ""} />
      </label>
      <Check name="current_pain" checked={value.current_pain}>
        Dolor actual
      </Check>
      <Check name="has_medical_condition" checked={value.has_medical_condition}>
        Condición médica
      </Check>
      <Check
        name="professional_clearance"
        checked={value.professional_clearance}
      >
        Autorización profesional
      </Check>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <div>
        <SubmitButton>Actualizar actividad</SubmitButton>
      </div>
    </form>
  );
}
export function NutritionSettingsForm({ value }: { value: NutritionProfile }) {
  const [state, action] = useActionState(
    updateNutritionSettings,
    initialFormState,
  );
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Choice
        name="diet_pattern"
        label="Tipo de alimentación"
        value={value.diet_pattern}
      >
        <option value="omnivore">Alimentos animales y vegetales</option>
        <option value="vegetarian">Vegetariana, sin carne ni pescado</option>
        <option value="vegan">Vegana, sin productos animales</option>
      </Choice>
      <Choice
        name="meals_per_day"
        label="Comidas"
        value={String(value.meals_per_day)}
      >
        <option value="3">3</option>
        <option value="4">4</option>
      </Choice>
      <Field
        name="cooking_minutes"
        label="Minutos para cocinar"
        type="number"
        min="10"
        max="120"
        defaultValue={value.cooking_minutes}
      />
      <Choice
        name="energy_calculation_sex"
        label="Cálculo aproximado de energía diaria"
        value={value.energy_calculation_sex ?? ""}
      >
        <option value="">No calcular</option>
        <option value="male">Usar referencia masculina</option>
        <option value="female">Usar referencia femenina</option>
      </Choice>
      <Field
        name="allergies"
        label="Alergias, separadas por comas"
        defaultValue={value.allergies.join(", ")}
      />
      <Field
        name="disliked_foods"
        label="Alimentos no deseados"
        defaultValue={value.disliked_foods.join(", ")}
      />
      <Check
        name="pregnancy_or_lactation"
        checked={value.pregnancy_or_lactation}
      >
        Embarazo o lactancia
      </Check>
      <Check name="eating_disorder" checked={value.eating_disorder}>
        Trastorno alimentario
      </Check>
      <Check
        name="renal_or_metabolic_condition"
        checked={value.renal_or_metabolic_condition}
      >
        Condición diagnosticada de los riñones o del metabolismo
      </Check>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <div>
        <SubmitButton>Actualizar alimentación</SubmitButton>
      </div>
    </form>
  );
}
function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <Input {...rest} />
    </label>
  );
}
function Choice({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <Select name={name} defaultValue={value}>
        {children}
      </Select>
    </label>
  );
}
function Check({
  name,
  checked,
  children,
}: {
  name: string;
  checked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm">
      <input
        className="mr-2"
        type="checkbox"
        name={name}
        defaultChecked={checked}
      />
      {children}
    </label>
  );
}

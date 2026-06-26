"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { completeOnboarding } from "@/lib/actions/app";
import { initialFormState, type FormState } from "@/lib/actions/state";
import { localISODate } from "@/lib/date";
import { FieldError, FormMessage, SubmitButton } from "./form-parts";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";

const steps = ["Perfil", "Actividad", "Alimentación", "Seguridad"];
const defaults: Record<string, string> = {
  goal: "fitness",
  experience: "beginner",
  current_activity: "light",
  available_days: "3",
  session_minutes: "40",
  diet_pattern: "omnivore",
  meals_per_day: "3",
  cooking_minutes: "30",
};

export function OnboardingForm() {
  const [state, action] = useActionState(completeOnboarding, initialFormState);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(defaults);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const raw = localStorage.getItem("glm-onboarding-draft");
    if (!raw || !formRef.current) return;
    try {
      const saved = JSON.parse(raw) as Record<string, string | string[]>;
      for (const element of Array.from(formRef.current.elements)) {
        if (
          !(
            element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement
          ) ||
          !element.name
        )
          continue;
        const value = saved[element.name];
        if (element instanceof HTMLInputElement && element.type === "checkbox")
          element.checked = Array.isArray(value)
            ? value.includes(element.value)
            : value === "on";
        else if (typeof value === "string") element.value = value;
      }
      const timer = window.setTimeout(
        () =>
          setDraft((current) => ({
            ...current,
            ...Object.fromEntries(
              Object.entries(saved).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            ),
          })),
        0,
      );
      return () => window.clearTimeout(timer);
    } catch {
      /* Ignore an invalid local draft. */
    }
  }, []);
  function capture() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const saved: Record<string, string | string[]> = {};
    for (const [key, value] of data.entries()) {
      const text = String(value);
      if (saved[key])
        saved[key] = Array.isArray(saved[key])
          ? [...saved[key], text]
          : [saved[key] as string, text];
      else saved[key] = text;
    }
    localStorage.setItem("glm-onboarding-draft", JSON.stringify(saved));
    setDraft((current) => ({
      ...current,
      ...Object.fromEntries(
        [...data.entries()].map(([key, value]) => [key, String(value)]),
      ),
    }));
  }
  function next() {
    const section = formRef.current?.querySelector<HTMLElement>(
      `[data-step="${step}"]`,
    );
    const fields = Array.from(
      section?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >("input,select,textarea") ?? [],
    );
    const invalid = fields.find((field) => !field.reportValidity());
    if (!invalid) setStep((value) => Math.min(3, value + 1));
  }
  return (
    <form
      ref={formRef}
      action={action}
      onChange={capture}
      className="grid gap-8"
    >
      <input type="hidden" name="local_date" value={localISODate()} />
      <input
        type="hidden"
        name="timezone"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
      />
      <Stepper steps={steps} current={step} />
      <section
        data-step="0"
        hidden={step !== 0}
        className="grid gap-5 sm:grid-cols-2"
      >
        <SectionHeading
          title="Tu punto de partida"
          description="Las mediciones sólo cambian cuando tú las registras."
        />
        <Field
          label="Nombre"
          name="name"
          state={state}
          required
          autoComplete="name"
        />
        <Field
          label="Fecha de nacimiento"
          name="birth_date"
          state={state}
          type="date"
          required
        />
        <Choice label="Sexo (opcional)" name="sex" defaultValue="">
          <option value="">Prefiero no indicarlo</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
          <option value="other">Otro</option>
          <option value="prefer_not_to_say">Prefiero no decirlo</option>
        </Choice>
        <Field
          label="Altura actual (cm)"
          name="height_cm"
          state={state}
          type="number"
          min="100"
          max="250"
          step="0.1"
          required
        />
        <Field
          label="Peso actual (kg)"
          name="weight_kg"
          state={state}
          type="number"
          min="30"
          max="350"
          step="0.1"
          required
        />
        <Choice label="Lo que buscas" name="goal" defaultValue="fitness">
          <option value="fitness">Mejorar condición física</option>
          <option value="body_recomposition">
            Perder grasa y ganar fuerza
          </option>
          <option value="fat_loss">Pérdida de grasa</option>
          <option value="muscle_gain">Ganancia muscular</option>
        </Choice>
      </section>
      <section
        data-step="1"
        hidden={step !== 1}
        className="grid gap-5 sm:grid-cols-2"
      >
        <SectionHeading
          title="Actividad y herramientas"
          description="Tu plan usará únicamente tiempo y equipo realmente disponibles."
        />
        <Choice label="Experiencia" name="experience" defaultValue="beginner">
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedia</option>
          <option value="advanced">Avanzada</option>
        </Choice>
        <Choice
          label="Actividad habitual"
          name="current_activity"
          defaultValue="light"
        >
          <option value="inactive">Poca actividad</option>
          <option value="light">Actividad ligera</option>
          <option value="regular">Actividad regular</option>
          <option value="very_active">Muy activa</option>
        </Choice>
        <Field
          label="Días disponibles"
          name="available_days"
          state={state}
          type="number"
          min="2"
          max="6"
          defaultValue="3"
          required
        />
        <Field
          label="Minutos por sesión"
          name="session_minutes"
          state={state}
          type="number"
          min="15"
          max="120"
          defaultValue="40"
          required
        />
        <div className="sm:col-span-2">
          <span className="text-sm font-semibold">Equipo disponible</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["none", "Sin equipo"],
              ["bands", "Bandas"],
              ["dumbbells", "Mancuernas"],
              ["gym", "Gimnasio"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="min-h-11 rounded-full border bg-white px-4 py-2.5 text-sm"
              >
                <input
                  className="mr-2 accent-secondary"
                  type="checkbox"
                  name="equipment"
                  value={value}
                  defaultChecked={value === "none"}
                />
                {label}
              </label>
            ))}
          </div>
          <FieldError state={state} name="equipment" />
        </div>
        <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
          Limitaciones conocidas
          <Textarea
            name="limitations"
            placeholder="Déjalo vacío si no tienes limitaciones."
          />
        </label>
        <Check name="has_medical_condition">
          Tengo una condición médica que puede afectar el ejercicio.
        </Check>
        <Check name="professional_clearance">
          Un profesional me autorizó a realizar actividad física.
        </Check>
      </section>
      <section
        data-step="2"
        hidden={step !== 2}
        className="grid gap-5 sm:grid-cols-2"
      >
        <SectionHeading
          title="Alimentación general"
          description="El menú respetará alergias, tipo de alimentación y tiempo disponible."
        />
        <Choice
          label="Tipo de alimentación"
          name="diet_pattern"
          defaultValue="omnivore"
        >
          <option value="omnivore">Como alimentos animales y vegetales</option>
          <option value="vegetarian">Vegetariana, sin carne ni pescado</option>
          <option value="vegan">Vegana, sin productos animales</option>
        </Choice>
        <Choice label="Comidas al día" name="meals_per_day" defaultValue="3">
          <option value="3">3 comidas</option>
          <option value="4">3 comidas y colación</option>
        </Choice>
        <Field
          label="Tiempo para cocinar (min)"
          name="cooking_minutes"
          state={state}
          type="number"
          min="10"
          max="120"
          defaultValue="30"
          required
        />
        <Choice
          label="Cálculo aproximado de energía diaria"
          name="energy_calculation_sex"
          defaultValue=""
        >
          <option value="">No calcular automáticamente</option>
          <option value="male">Ecuación de referencia masculina</option>
          <option value="female">Ecuación de referencia femenina</option>
        </Choice>
        <Field
          label="Alergias, separadas por comas"
          name="allergies"
          state={state}
          placeholder="Ej. lácteos, nueces, gluten"
        />
        <Field
          label="Alimentos que no deseas"
          name="disliked_foods"
          state={state}
          placeholder="Ej. champiñones, atún"
        />
        <Check name="pregnancy_or_lactation">Embarazo o lactancia.</Check>
        <Check name="eating_disorder">
          Antecedente o presencia de trastorno alimentario.
        </Check>
        <Check name="renal_or_metabolic_condition">
          Tengo una condición diagnosticada de los riñones o del metabolismo.
        </Check>
      </section>
      <section data-step="3" hidden={step !== 3} className="grid gap-5">
        <SectionHeading
          title="Revisa y acepta"
          description="Podrás modificar actividad y alimentación desde Ajustes."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Summary
            label="Perfil"
            value={`${draft.name || "Nombre pendiente"} · ${goalLabel(draft.goal)}`}
          />
          <Summary
            label="Disponibilidad"
            value={`${draft.available_days} días · ${draft.session_minutes} min`}
          />
          <Summary
            label="Alimentación"
            value={`${dietLabel(draft.diet_pattern)} · ${draft.meals_per_day} comidas`}
          />
          <Summary label="Privacidad" value="Contexto mínimo para la guía IA" />
        </div>
        <div className="grid gap-3 rounded-2xl bg-[#17201b] p-5 text-sm text-white">
          <Check name="accepted_terms" required>
            Acepto el tratamiento de mis datos para personalizar GLM.
          </Check>
          <Check name="accepted_safety" required>
            Entiendo que GLM no diagnostica, trata lesiones ni reemplaza
            profesionales de salud.
          </Check>
        </div>
        <FormMessage state={state} />
      </section>
      <div className="sticky bottom-3 z-10 flex items-center justify-between rounded-full border bg-card/95 p-2 shadow-xl backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0}
        >
          <ArrowLeft size={17} />
          Atrás
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={next}>
            Continuar
            <ArrowRight size={17} />
          </Button>
        ) : (
          <SubmitButton>Crear mi guía</SubmitButton>
        )}
      </div>
    </form>
  );
}
function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="sm:col-span-2">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
function Field({
  label,
  name,
  state,
  ...props
}: { label: string; name: string; state: FormState } & React.ComponentProps<
  typeof Input
>) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <Input name={name} {...props} />
      <FieldError state={state} name={name} />
    </label>
  );
}
function Choice({
  label,
  name,
  children,
  defaultValue,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <Select name={name} defaultValue={defaultValue}>
        {children}
      </Select>
    </label>
  );
}
function Check({
  name,
  children,
  required,
}: {
  name: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex min-h-11 items-start gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm leading-5">
      <input
        className="mt-0.5 size-4 accent-primary"
        type="checkbox"
        name={name}
        required={required}
      />
      <span>{children}</span>
    </label>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
function goalLabel(value: string) {
  return (
    (
      {
        fitness: "Condición física",
        body_recomposition: "Perder grasa y ganar fuerza",
        fat_loss: "Pérdida de grasa",
        muscle_gain: "Ganancia muscular",
      } as Record<string, string>
    )[value] ?? value
  );
}
function dietLabel(value: string) {
  return (
    (
      {
        omnivore: "Alimentos animales y vegetales",
        vegetarian: "Vegetariana",
        vegan: "Vegana",
      } as Record<string, string>
    )[value] ?? value
  );
}

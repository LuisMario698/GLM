import { ShieldCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import type { NutritionProfile, TrainingProfile } from "@/types/domain";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import {
  NutritionSettingsForm,
  TrainingSettingsForm,
} from "@/components/forms/settings-forms";
import { UrlTabs } from "@/components/ui/url-tabs";
import { StatusBanner } from "@/components/ui/feedback";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = ["entrenamiento", "alimentacion", "seguridad"].includes(
    params.tab ?? "",
  )
    ? params.tab!
    : "entrenamiento";
  const { supabase, userId } = await requireProfile();
  const [{ data: training }, { data: nutrition }] = await Promise.all([
    supabase
      .from("training_profiles")
      .select("*")
      .eq("profile_id", userId)
      .single(),
    supabase
      .from("nutrition_profiles")
      .select("*")
      .eq("profile_id", userId)
      .single(),
  ]);
  const tabs = [
    {
      value: "entrenamiento",
      label: "Entrenamiento",
      href: "/ajustes?tab=entrenamiento",
    },
    {
      value: "alimentacion",
      label: "Alimentación",
      href: "/ajustes?tab=alimentacion",
    },
    { value: "seguridad", label: "Seguridad", href: "/ajustes?tab=seguridad" },
  ];
  return (
    <section className="space-y-7">
      <PageHeader
        eyebrow="Datos editables"
        title="Ajustes"
        description="Actualiza tu situación, disponibilidad, herramientas y preferencias cuando cambien."
      />
      <UrlTabs items={tabs} active={tab} />
      {tab === "alimentacion" ? (
        <Card>
          <h2 className="font-display mb-2 text-2xl">
            Preferencias alimentarias
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Cambiar estos datos invalida la estimación anterior y requiere
            confirmarla nuevamente.
          </p>
          <NutritionSettingsForm value={nutrition as NutritionProfile} />
        </Card>
      ) : tab === "seguridad" ? (
        <div className="grid gap-4">
          <StatusBanner
            tone="warning"
            title="GLM no sustituye atención profesional"
          >
            Dolor, mareo o dolor en el pecho pausan la sesión. El cálculo
            automático de alimentación se desactiva durante embarazo o
            lactancia, ante un trastorno alimentario o si existe una condición
            diagnosticada de los riñones o del metabolismo.
          </StatusBanner>
          <Card>
            <ShieldCheck className="text-secondary" />
            <h2 className="font-display mt-4 text-3xl">Tus datos y la IA</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              OpenAI recibe únicamente objetivo, estado diario y explicación
              aprobada. No recibe nombre, correo ni notas clínicas completas.
              Las conversaciones expiran después de 30 días y pueden borrarse
              antes.
            </p>
          </Card>
        </div>
      ) : (
        <Card>
          <h2 className="font-display mb-2 text-2xl">
            Situación y herramientas
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Las próximas semanas utilizarán esta disponibilidad y equipo.
          </p>
          <TrainingSettingsForm value={training as TrainingProfile} />
        </Card>
      )}
    </section>
  );
}

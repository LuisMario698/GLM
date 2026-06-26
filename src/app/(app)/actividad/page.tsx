import { requireProfile } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { effortSummary } from "@/lib/effort";
import { ActivityForm } from "@/components/forms/simple-record-forms";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { UrlTabs } from "@/components/ui/url-tabs";
import { EmptyState } from "@/components/ui/feedback";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: requested } = await searchParams;
  const tab = requested === "historial" ? "historial" : "registrar";
  const { supabase, userId } = await requireProfile();
  const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("profile_id", userId)
    .order("performed_on", { ascending: false })
    .limit(50);
  const tabs = [
    {
      value: "registrar",
      label: "Registrar",
      href: "/actividad?tab=registrar",
    },
    {
      value: "historial",
      label: "Historial",
      href: "/actividad?tab=historial",
      count: data?.length ?? 0,
    },
  ];
  return (
    <section className="space-y-7">
      <PageHeader
        eyebrow="Registro real"
        title="Actividad"
        description="Guarda únicamente lo que realizaste. GLM no convierte minutos en cambios corporales estimados."
      />
      <UrlTabs items={tabs} active={tab} />
      {tab === "registrar" ? (
        <Card>
          <h2 className="font-display mb-2 text-2xl">Nueva actividad</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            También puedes completar una sesión guiada desde tu plan.
          </p>
          <ActivityForm />
        </Card>
      ) : data?.length ? (
        <div className="grid gap-3">
          {data.map((item) => (
            <Card key={item.id}>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {formatDate(item.performed_on)} ·{" "}
                {activityLabel(item.activity_type)}
              </p>
              <h2 className="font-display mt-1 text-2xl">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.duration_minutes} min
                {item.intensity_rpe
                  ? ` · Dificultad ${effortSummary(item.intensity_rpe)}`
                  : ""}
              </p>
              {item.notes && (
                <p className="mt-3 border-t pt-3 text-sm leading-6">
                  {item.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin actividades todavía"
          description="Tu historial mostrará únicamente actividades que registres o sesiones que finalices."
        />
      )}
    </section>
  );
}
function activityLabel(value: string) {
  return (
    (
      {
        strength: "Fuerza",
        walking: "Caminata",
        running: "Carrera",
        cycling: "Ciclismo",
        sport: "Deporte",
        mobility: "Movilidad",
        other: "Otra",
      } as Record<string, string>
    )[value] ?? value
  );
}

import Link from "next/link";
import { BookOpen, Clock3 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { addDays, localISODate, mondayOf } from "@/lib/date";
import type { NutritionProfile } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  MealActions,
  TargetActions,
} from "@/components/nutrition/nutrition-actions";
import { UrlTabs } from "@/components/ui/url-tabs";
import { EmptyState, StatusBanner } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";

type RecipeInfo = {
  name: string;
  calories: number;
  protein_g: number;
  prep_minutes: number;
  instructions: string[];
  cuisine: string;
  source_note: string;
  allergens: string[];
};
type MealItem = {
  id: string;
  planned_on: string;
  slot: string;
  recipe_id: string;
  servings: number;
  recipes: RecipeInfo;
  meal_logs: { status: string }[];
};
type IngredientItem = {
  recipe_id: string;
  quantity: number;
  foods: { name: string; unit: string };
};

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; day?: string }>;
}) {
  const params = await searchParams;
  const tab = ["hoy", "semana", "compras", "referencias"].includes(
    params.tab ?? "",
  )
    ? params.tab!
    : "hoy";
  const today = localISODate();
  const weekStart = mondayOf(today);
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? "")
    ? params.day!
    : today;
  const { supabase, userId } = await requireProfile();
  const [{ data: nutrition }, { data: plan }] = await Promise.all([
    supabase
      .from("nutrition_profiles")
      .select("*")
      .eq("profile_id", userId)
      .single(),
    supabase
      .from("meal_plans")
      .select("*")
      .eq("profile_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle(),
  ]);
  const n = nutrition as NutritionProfile;
  const { data: rawItems } = plan
    ? await supabase
        .from("meal_plan_items")
        .select("*,recipes(*),meal_logs(status)")
        .eq("meal_plan_id", plan.id)
        .order("planned_on")
        .order("slot")
    : { data: [] };
  const items = (rawItems ?? []) as MealItem[];
  const recipeIds = [...new Set(items.map((item) => item.recipe_id))];
  const { data: rawIngredients } = recipeIds.length
    ? await supabase
        .from("recipe_ingredients")
        .select("*,foods(name,unit)")
        .in("recipe_id", recipeIds)
    : { data: [] };
  const ingredients = (rawIngredients ?? []) as IngredientItem[];
  const blocked =
    n.pregnancy_or_lactation ||
    n.eating_disorder ||
    n.renal_or_metabolic_condition;
  const tabs = [
    {
      value: "hoy",
      label: "Hoy",
      href: "/alimentacion?tab=hoy",
      count: items.filter((item) => item.planned_on === today).length,
    },
    {
      value: "semana",
      label: "Semana",
      href: `/alimentacion?tab=semana&day=${selectedDay}`,
    },
    { value: "compras", label: "Compras", href: "/alimentacion?tab=compras" },
    {
      value: "referencias",
      label: "Referencias",
      href: "/alimentacion?tab=referencias",
    },
  ];
  return (
    <section className="space-y-7">
      <PageHeader
        eyebrow="Orientación general"
        title="Alimentación"
        description="Menús curados para adultos sanos. Son referencias educativas, no tratamiento ni dieta clínica."
      />
      <UrlTabs items={tabs} active={tab} />
      {blocked && (
        <StatusBanner tone="warning" title="Cálculo automático desactivado">
          Solicita orientación individual a un profesional por la condición
          marcada en tus ajustes.
        </StatusBanner>
      )}
      {tab === "referencias" ? (
        <>
          <Card>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl">
                  Rango diario aproximado
                </h2>
                {n.energy_target_min ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Energía aproximada:{" "}
                    <strong>
                      {n.energy_target_min}–{n.energy_target_max} calorías
                    </strong>{" "}
                    · Proteína:{" "}
                    <strong>
                      {n.protein_target_min}–{n.protein_target_max} g
                    </strong>
                    {n.target_confirmed_at
                      ? " · confirmado"
                      : " · pendiente de confirmación"}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aún no has calculado una referencia.
                  </p>
                )}
              </div>
              {!blocked && (
                <TargetActions
                  estimated={Boolean(n.energy_target_min)}
                  confirmed={Boolean(n.target_confirmed_at)}
                />
              )}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Este rango se calcula con una fórmula basada en edad, peso, altura
              y actividad. Puede variar aproximadamente 10 % y no predice peso
              ni resultados.
            </p>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <SourceCard
              title="NOM-043"
              text="Orientación alimentaria mexicana y Plato del Bien Comer."
            />
            <SourceCard
              title="USDA FoodData Central"
              text="Referencia de composición nutrimental de ingredientes."
            />
            <SourceCard
              title="WHO Healthy Diet"
              text="Adecuación, equilibrio, moderación y diversidad."
            />
            <SourceCard
              title="Fórmula Mifflin–St Jeor"
              text="Método científico usado para aproximar la energía que el cuerpo utiliza en reposo."
            />
          </div>
        </>
      ) : tab === "compras" ? (
        items.length ? (
          <Card>
            <h2 className="font-display text-2xl">Lista de compras</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cantidades base aproximadas; ajusta por porciones y existencias.
            </p>
            <ul className="mt-5 columns-1 gap-8 text-sm sm:columns-2 lg:columns-3">
              {grocery(ingredients, items).map((line) => (
                <li
                  key={line}
                  className="mb-3 break-inside-avoid rounded-lg bg-muted px-3 py-2"
                >
                  □ {line}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <NoMenu />
        )
      ) : tab === "semana" ? (
        items.length ? (
          <>
            <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 7 }, (_, index) =>
                addDays(weekStart, index),
              ).map((date) => (
                <Link
                  key={date}
                  href={`/alimentacion?tab=semana&day=${date}`}
                  className={
                    date === selectedDay
                      ? "min-w-20 rounded-2xl bg-secondary px-3 py-3 text-center text-white"
                      : "min-w-20 rounded-2xl border bg-card px-3 py-3 text-center"
                  }
                >
                  <span className="block text-[10px] font-bold uppercase">
                    {date === today ? "Hoy" : weekday(date)}
                  </span>
                  <span className="font-display text-xl">
                    {new Date(`${date}T12:00:00`).getDate()}
                  </span>
                </Link>
              ))}
            </div>
            <MealGrid
              items={items.filter((item) => item.planned_on === selectedDay)}
            />
          </>
        ) : (
          <NoMenu />
        )
      ) : items.some((item) => item.planned_on === today) ? (
        <MealGrid items={items.filter((item) => item.planned_on === today)} />
      ) : (
        <EmptyState
          title="Sin comidas para hoy"
          description="Genera un menú semanal desde Referencias después de confirmar tu rango."
          action={
            <Link
              className="font-semibold text-secondary"
              href="/alimentacion?tab=referencias"
            >
              Ir a referencias
            </Link>
          }
        />
      )}
    </section>
  );
}
function MealGrid({ items }: { items: MealItem[] }) {
  return items.length ? (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {slot(item.slot)}
          </p>
          <h2 className="font-display mt-2 text-2xl">{item.recipes.name}</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={14} />
              {item.recipes.prep_minutes} min
            </span>
            <span>
              {Math.round(item.recipes.calories * item.servings)} calorías
            </span>
            <span>
              {Math.round(item.recipes.protein_g * item.servings)} g proteína
            </span>
          </div>
          <div className="mt-auto pt-4">
            <Modal
              title={item.recipes.name}
              description={`${item.recipes.cuisine === "mexican" ? "Cocina mexicana" : "Cocina internacional"} · ${item.recipes.source_note}`}
              trigger={
                <button className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary">
                  <BookOpen size={16} />
                  Ver receta
                </button>
              }
            >
              <ol className="grid gap-3">
                {item.recipes.instructions.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {item.recipes.allergens.length > 0 && (
                <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  Alérgenos declarados: {item.recipes.allergens.join(", ")}
                </p>
              )}
            </Modal>
            <MealActions
              itemId={item.id}
              status={item.meal_logs?.[0]?.status}
            />
          </div>
        </Card>
      ))}
    </div>
  ) : (
    <EmptyState
      title="Sin comidas para este día"
      description="El menú actual no contiene elementos para la fecha seleccionada."
    />
  );
}
function NoMenu() {
  return (
    <EmptyState
      title="Aún no hay menú"
      description="Calcula y confirma tus referencias para generar siete días de comidas compatibles."
      action={
        <Link
          className="font-semibold text-secondary"
          href="/alimentacion?tab=referencias"
        >
          Configurar referencias
        </Link>
      }
    />
  );
}
function SourceCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-wide text-primary">
        Fuente
      </p>
      <h2 className="font-display mt-2 text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </Card>
  );
}
function slot(value: string) {
  return (
    (
      {
        breakfast: "Desayuno",
        lunch: "Comida",
        dinner: "Cena",
        snack: "Colación",
      } as Record<string, string>
    )[value] ?? value
  );
}
function weekday(date: string) {
  return new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(
    new Date(`${date}T12:00:00`),
  );
}
function grocery(ingredients: IngredientItem[], items: MealItem[]) {
  const totals = new Map<string, number>();
  for (const ingredient of ingredients) {
    const uses = items.filter(
      (item) => item.recipe_id === ingredient.recipe_id,
    );
    const value = uses.reduce(
      (sum, item) => sum + Number(ingredient.quantity) * Number(item.servings),
      0,
    );
    totals.set(
      ingredient.foods.name,
      (totals.get(ingredient.foods.name) ?? 0) + value,
    );
  }
  return [...totals.entries()].map(
    ([name, count]) => `${name}: ${Math.round(count * 10) / 10} porciones base`,
  );
}

"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import type { Exercise } from "@/types/domain";
import {
  equipmentLabel,
  levelLabel,
  movementLabel,
} from "@/lib/exercise-labels";
import { Input } from "@/components/ui/input";
import { ExerciseVisual } from "./exercise-visual";

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState("all");
  const deferred = useDeferredValue(query);
  const filtered = exercises.filter(
    (exercise) =>
      (equipment === "all" || exercise.equipment.includes(equipment)) &&
      `${exercise.name} ${movementLabel(exercise.movement)}`
        .toLowerCase()
        .includes(deferred.toLowerCase()),
  );
  const equipmentOptions = [
    ["all", "Todo"],
    ["none", "Sin equipo"],
    ["bands", "Bandas"],
    ["dumbbells", "Mancuernas"],
    ["gym", "Gimnasio"],
  ];
  return (
    <>
      <div className="rounded-2xl border bg-card p-4">
        <Input
          aria-label="Buscar ejercicio"
          placeholder="Buscar por nombre o movimiento"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div
          className="scrollbar-none mt-3 flex gap-2 overflow-x-auto"
          role="group"
          aria-label="Filtrar por equipo"
        >
          {equipmentOptions.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setEquipment(value)}
              aria-pressed={equipment === value}
              className={
                equipment === value
                  ? "min-h-11 shrink-0 rounded-full bg-secondary px-4 text-sm font-semibold text-white"
                  : "min-h-11 shrink-0 rounded-full border bg-white px-4 text-sm font-semibold text-muted-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((exercise) => (
            <Link
              href={`/ejercicios/${exercise.slug}`}
              key={exercise.id}
              className="group overflow-hidden rounded-[1.6rem] border bg-card shadow-[0_18px_55px_rgba(23,32,27,.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(23,32,27,.1)]"
            >
              <ExerciseVisual
                slug={exercise.slug}
                name={exercise.name}
                className="rounded-none"
              />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {movementLabel(exercise.movement)} ·{" "}
                  {levelLabel(exercise.level)}
                </p>
                <h2 className="font-display mt-2 text-2xl">{exercise.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Equipo: {exercise.equipment.map(equipmentLabel).join(", ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          No hay ejercicios que coincidan con estos filtros.
        </div>
      )}
    </>
  );
}

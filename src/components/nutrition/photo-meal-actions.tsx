"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import {
  deletePhotoMeal,
  markPhotoMealConsumed,
  refineMealAnalysis,
} from "@/lib/actions/photo-meals";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function PhotoMealActions({
  mealId,
  status,
}: {
  mealId: string;
  status: "pending" | "consumed";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    start(async () => {
      const result = await action();
      setMessage(result.ok ? result.message ?? "Actualizado." : result.error ?? "Error.");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {status === "pending" ? (
        <Button
          type="button"
          className="min-h-10 px-4 text-xs"
          disabled={pending}
          onClick={() => run(() => markPhotoMealConsumed(mealId))}
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Marcar consumida
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="min-h-10 px-4 text-xs"
        disabled={pending}
        onClick={() => run(() => deletePhotoMeal(mealId))}
      >
        <Trash2 size={15} />
        Eliminar
      </Button>
      {message ? <p className="w-full text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}

export function PhotoMealRefineForm({
  mealId,
  questions,
}: {
  mealId: string;
  questions: string[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!answers.trim() || pending) return;
    start(async () => {
      const result = await refineMealAnalysis(mealId, answers);
      setMessage(result.ok ? result.message ?? "Análisis actualizado." : result.error ?? "Error.");
      if (result.ok) setAnswers("");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-2xl border bg-muted/60 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-secondary">
        Mejorar estimación
      </p>
      {questions.length ? (
        <ul className="mt-2 grid gap-1 text-xs leading-5 text-muted-foreground">
          {questions.map((question) => (
            <li key={question}>- {question}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Agrega detalles de cantidad, ingredientes o porciones para ajustar el análisis.
        </p>
      )}
      <Textarea
        value={answers}
        onChange={(event) => setAnswers(event.target.value)}
        placeholder="Ejemplo: eran 2 tortillas, media taza de arroz y el pollo era del tamaño de mi palma."
        className="mt-3 min-h-20 bg-white"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 px-4 text-xs"
          disabled={pending || !answers.trim()}
          onClick={submit}
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : null}
          Ajustar con respuestas
        </Button>
        {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
      </div>
    </div>
  );
}

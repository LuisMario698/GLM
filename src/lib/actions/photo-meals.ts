'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import {
  PHOTO_MEAL_BUCKET,
  parsePhotoMealAnalysis,
  photoMealPathSchema,
  validateStoredPhotoMeal,
  type PhotoMealAnalysis,
} from '@/lib/photo-meals';
import { refinePhotoMealSchema, registerPhotoMealSchema } from '@/lib/validations';
import type { ActionResult, PhotoMealAnalysisStatus } from '@/types/domain';
import { asResult } from './state';

type RegisterPhotoMealResult = {
  mealId: string;
  analysisStatus: PhotoMealAnalysisStatus;
};

export async function registerPhotoMeal(input: {
  imagePath: string;
  imageType: 'image/jpeg' | 'image/png' | 'image/webp';
  imageSize: number;
}): Promise<ActionResult<RegisterPhotoMealResult>> {
  const parsed = registerPhotoMealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La imagen no es válida.' };

  try {
    const { supabase, userId } = await requireUser();
    const { imagePath, imageType, imageSize } = parsed.data;
    const path = validateMealImagePath(imagePath, userId);
    const uploadError = validateStoredPhotoMeal({ type: imageType, size: imageSize });
    if (uploadError) return { ok: false, error: uploadError };

    const { data: image, error: downloadError } = await supabase.storage
      .from(PHOTO_MEAL_BUCKET)
      .download(path);
    if (downloadError || !image) return { ok: false, error: 'No se encontró la imagen subida.' };

    const storedError = validateStoredPhotoMeal({
      type: image.type || imageType,
      size: image.size || imageSize,
    });
    if (storedError) return { ok: false, error: storedError };

    const { data: meal, error: insertError } = await supabase
      .from('meals')
      .insert({
        profile_id: userId,
        image_path: path,
        title: 'Platillo pendiente',
        status: 'pending',
        analysis_status: 'analyzing',
      })
      .select('id')
      .single();
    if (insertError || !meal) throw insertError ?? new Error('No fue posible crear la comida.');

    const analysis = await runAnalysisSafely(image, imageType, null);
    await persistAnalysis({
      supabase,
      mealId: meal.id,
      analysis,
      status: analysis.ok ? 'needs_review' : 'failed',
      model: analysis.model,
      error: analysis.ok ? null : analysis.error,
      quantityNotes: null,
    });

    revalidatePhotoMealPaths();
    return {
      ok: true,
      data: { mealId: meal.id, analysisStatus: analysis.ok ? 'needs_review' : 'failed' },
      message: analysis.ok
        ? 'Comida guardada como pendiente. Revisa la estimación antes de usarla.'
        : 'Comida guardada como pendiente. El análisis falló y puedes reintentarlo después.',
    };
  } catch (error) {
    return asResult(error, 'No fue posible registrar la comida.');
  }
}

export async function refineMealAnalysis(
  mealId: string,
  answers: string,
): Promise<ActionResult> {
  const parsed = refinePhotoMealSchema.safeParse({ mealId, answers });
  if (!parsed.success) return { ok: false, error: 'Las respuestas no son válidas.' };

  try {
    const { supabase, userId } = await requireUser();
    const { data: meal } = await supabase
      .from('meals')
      .select('id,image_path,status')
      .eq('id', parsed.data.mealId)
      .eq('profile_id', userId)
      .single();
    if (!meal) return { ok: false, error: 'Comida no encontrada.' };

    const path = validateMealImagePath(meal.image_path, userId);
    await supabase.from('meals').update({ analysis_status: 'analyzing' }).eq('id', meal.id);
    const { data: image, error: downloadError } = await supabase.storage
      .from(PHOTO_MEAL_BUCKET)
      .download(path);
    if (downloadError || !image) return { ok: false, error: 'No se pudo leer la imagen.' };

    const analysis = await runAnalysisSafely(image, image.type || 'image/webp', parsed.data.answers);
    await persistAnalysis({
      supabase,
      mealId: meal.id,
      analysis,
      status: analysis.ok ? 'reviewed' : 'failed',
      model: analysis.model,
      error: analysis.ok ? null : analysis.error,
      quantityNotes: parsed.data.answers,
    });

    revalidatePhotoMealPaths();
    return analysis.ok
      ? { ok: true, data: undefined, message: 'Estimación actualizada con tus respuestas.' }
      : { ok: false, error: analysis.error };
  } catch (error) {
    return asResult(error, 'No fue posible actualizar el análisis.');
  }
}

export async function markPhotoMealConsumed(mealId: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { error } = await supabase
      .from('meals')
      .update({ status: 'consumed', consumed_at: new Date().toISOString() })
      .eq('id', mealId)
      .eq('profile_id', userId)
      .eq('status', 'pending');
    if (error) throw error;
    revalidatePhotoMealPaths();
    return { ok: true, data: undefined, message: 'Comida marcada como consumida.' };
  } catch (error) {
    return asResult(error, 'No fue posible marcar la comida como consumida.');
  }
}

export async function deletePhotoMeal(mealId: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireUser();
    const { data: meal } = await supabase
      .from('meals')
      .select('id,image_path')
      .eq('id', mealId)
      .eq('profile_id', userId)
      .single();
    if (!meal) return { ok: false, error: 'Comida no encontrada.' };

    const path = validateMealImagePath(meal.image_path, userId);
    await supabase.storage.from(PHOTO_MEAL_BUCKET).remove([path]);
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', meal.id)
      .eq('profile_id', userId);
    if (error) throw error;

    revalidatePhotoMealPaths();
    return { ok: true, data: undefined, message: 'Comida eliminada.' };
  } catch (error) {
    return asResult(error, 'No fue posible eliminar la comida.');
  }
}

function validateMealImagePath(path: string, userId: string) {
  const parsed = photoMealPathSchema.safeParse(path);
  if (!parsed.success || !path.startsWith(`${userId}/`)) {
    throw new Error('La ruta de la imagen no pertenece a tu cuenta.');
  }
  return path;
}

async function runAnalysisSafely(
  image: Blob,
  fallbackType: string,
  quantityNotes: string | null,
): Promise<
  | { ok: true; data: PhotoMealAnalysis; model: string }
  | { ok: false; error: string; model: string | null }
> {
  const model = process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';
  try {
    const dataUrl = await blobToDataUrl(image, image.type || fallbackType);
    const data = await analyzePhotoMeal(dataUrl, model, quantityNotes);
    return { ok: true, data, model };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No fue posible analizar la imagen.',
      model,
    };
  }
}

async function analyzePhotoMeal(
  imageDataUrl: string,
  model: string,
  quantityNotes: string | null,
) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no está configurada.');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: 'low' },
      instructions:
        'Eres un asistente nutricional de GLM para adultos sanos. Identifica alimentos visibles en una foto de comida y estima calorias y macronutrientes de forma aproximada. No diagnostiques, no des tratamiento medico y no presentes estimaciones como exactas. Si faltan cantidades, genera preguntas concretas para mejorar la estimacion.',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: quantityNotes
                ? `Analiza de nuevo este platillo usando estas respuestas del usuario sobre cantidades: ${quantityNotes}`
                : 'Analiza este platillo. Devuelve estimaciones aproximadas y preguntas para confirmar cantidades.',
            },
            { type: 'input_image', image_url: imageDataUrl, detail: 'low' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'glm_photo_meal_analysis',
          strict: true,
          schema: photoMealJsonSchema,
        },
      },
      max_output_tokens: 700,
    }),
  });
  if (!response.ok) throw new Error('El análisis con IA no está disponible.');

  const json = await response.json();
  const raw = json.output
    ?.flatMap((item: { content?: { type: string; text?: string }[] }) => item.content ?? [])
    .find((item: { type: string }) => item.type === 'output_text')?.text;
  if (!raw) throw new Error('La IA devolvió una respuesta vacía.');
  return parsePhotoMealAnalysis(raw);
}

async function blobToDataUrl(blob: Blob, contentType: string) {
  const buffer = Buffer.from(await blob.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

async function persistAnalysis({
  supabase,
  mealId,
  analysis,
  status,
  model,
  error,
  quantityNotes,
}: {
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;
  mealId: string;
  analysis:
    | { ok: true; data: PhotoMealAnalysis; model: string }
    | { ok: false; error: string; model: string | null };
  status: PhotoMealAnalysisStatus;
  model: string | null;
  error: string | null;
  quantityNotes: string | null;
}) {
  const data = analysis.ok ? analysis.data : null;
  const { error: updateError } = await supabase
    .from('meals')
    .update({
      title: data?.title ?? 'Platillo pendiente',
      calories_estimated: data?.nutrition.calories ?? null,
      protein_estimated: data?.nutrition.protein_g ?? null,
      carbs_estimated: data?.nutrition.carbs_g ?? null,
      fat_estimated: data?.nutrition.fat_g ?? null,
      detected_items: data?.detected_items ?? [],
      analysis_questions: data?.analysis_questions ?? [],
      analysis_status: status,
      analysis_error: error,
      analysis_model: model,
      quantity_notes: quantityNotes,
      analysis_completed_at: new Date().toISOString(),
    })
    .eq('id', mealId);
  if (updateError) throw updateError;
}

function revalidatePhotoMealPaths() {
  revalidatePath('/alimentacion');
  revalidatePath('/hoy');
}

const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] };

const photoMealJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    detected_items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          quantity_estimate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          confidence: { type: 'number' },
        },
        required: ['name', 'quantity_estimate', 'confidence'],
      },
    },
    analysis_questions: { type: 'array', items: { type: 'string' } },
    nutrition: {
      type: 'object',
      additionalProperties: false,
      properties: {
        calories: nullableNumber,
        protein_g: nullableNumber,
        carbs_g: nullableNumber,
        fat_g: nullableNumber,
      },
      required: ['calories', 'protein_g', 'carbs_g', 'fat_g'],
    },
  },
  required: ['title', 'detected_items', 'analysis_questions', 'nutrition'],
} as const;

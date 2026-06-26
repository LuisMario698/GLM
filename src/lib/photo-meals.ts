import { z } from "zod";

export const PHOTO_MEAL_BUCKET = "meal-photos";
export const PHOTO_MEAL_MAX_ORIGINAL_BYTES = 12 * 1024 * 1024;
export const PHOTO_MEAL_MAX_STORED_BYTES = 4.5 * 1024 * 1024;
export const PHOTO_MEAL_MAX_SIDE = 1600;

export const acceptedPhotoMealTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const photoMealPathSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/\d{4}-\d{2}-\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|jpeg|png)$/i,
    "Ruta de imagen no válida.",
  );

export const photoMealAnalysisSchema = z.object({
  title: z.string().trim().min(2).max(120).default("Platillo pendiente"),
  detected_items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        quantity_estimate: z.string().trim().max(120).nullable(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(12)
    .default([]),
  analysis_questions: z.array(z.string().trim().min(2).max(180)).max(5).default([]),
  nutrition: z.object({
    calories: z.number().min(0).max(5000).nullable(),
    protein_g: z.number().min(0).max(500).nullable(),
    carbs_g: z.number().min(0).max(800).nullable(),
    fat_g: z.number().min(0).max(500).nullable(),
  }),
});

export type PhotoMealAnalysis = z.infer<typeof photoMealAnalysisSchema>;

export function validatePhotoMealUpload(file: { type: string; size: number }) {
  if (!acceptedPhotoMealTypes.includes(file.type as (typeof acceptedPhotoMealTypes)[number])) {
    return "Usa una imagen JPG, PNG o WebP.";
  }
  if (file.size <= 0) return "La imagen está vacía.";
  if (file.size > PHOTO_MEAL_MAX_ORIGINAL_BYTES) {
    return "La imagen es demasiado grande. Usa una foto menor a 12 MB.";
  }
  return null;
}

export function validateStoredPhotoMeal(file: { type: string; size: number }) {
  const typeError = validatePhotoMealUpload(file);
  if (typeError) return typeError;
  if (file.size > PHOTO_MEAL_MAX_STORED_BYTES) {
    return "No fue posible comprimir la imagen lo suficiente.";
  }
  return null;
}

export function photoMealExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return "webp";
}

export function buildPhotoMealPath(userId: string, type: string, id = crypto.randomUUID()) {
  const date = new Date().toISOString().slice(0, 10);
  return `${userId}/${date}/${id}.${photoMealExtension(type)}`;
}

export function parsePhotoMealAnalysis(raw: string) {
  return photoMealAnalysisSchema.parse(JSON.parse(raw));
}

export function canConsumePhotoMeal(status: "pending" | "consumed") {
  return status === "pending";
}

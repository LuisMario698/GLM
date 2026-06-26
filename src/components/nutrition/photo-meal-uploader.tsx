/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, RotateCcw, Save, X } from "lucide-react";
import { registerPhotoMeal } from "@/lib/actions/photo-meals";
import { createClient } from "@/lib/supabase/browser";
import {
  buildPhotoMealPath,
  PHOTO_MEAL_BUCKET,
  PHOTO_MEAL_MAX_SIDE,
  PHOTO_MEAL_MAX_STORED_BYTES,
  validatePhotoMealUpload,
} from "@/lib/photo-meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PreparedPhoto = {
  blob: Blob;
  previewUrl: string;
};

export function PhotoMealUploader() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<PreparedPhoto | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function choose(file: File | undefined) {
    clearPrepared();
    setMessage("");
    setError("");
    if (!file) return;

    const validationError = validatePhotoMealUpload(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const blob = await compressImage(file);
      if (blob.size > PHOTO_MEAL_MAX_STORED_BYTES) {
        setError("No fue posible comprimir la imagen lo suficiente.");
        return;
      }
      setPrepared({ blob, previewUrl: URL.createObjectURL(blob) });
    } catch {
      setError("No fue posible preparar la imagen.");
    }
  }

  function save() {
    if (!prepared || pending) return;
    setError("");
    setMessage("");

    start(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Tu sesión expiró. Inicia sesión de nuevo.");
        return;
      }

      const imageType = normalizeImageType(prepared.blob.type);
      const imagePath = buildPhotoMealPath(user.id, imageType);
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_MEAL_BUCKET)
        .upload(imagePath, prepared.blob, {
          cacheControl: "3600",
          contentType: imageType,
          upsert: false,
        });
      if (uploadError) {
        setError("No fue posible subir la imagen.");
        return;
      }

      const result = await registerPhotoMeal({
        imagePath,
        imageType,
        imageSize: prepared.blob.size,
      });
      if (!result.ok) {
        await supabase.storage.from(PHOTO_MEAL_BUCKET).remove([imagePath]);
        setError(result.error);
        return;
      }

      clearPrepared();
      setMessage(result.message ?? "Comida guardada como pendiente.");
      router.refresh();
    });
  }

  function clearPrepared() {
    if (prepared?.previewUrl) URL.revokeObjectURL(prepared.previewUrl);
    setPrepared(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  return (
    <Card className="overflow-hidden border-secondary/20 bg-gradient-to-br from-card via-[#fff7ef] to-[#edf5ef]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">
            Registro con foto
          </p>
          <h2 className="font-display mt-2 text-3xl">Agregar comida con foto</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Toma o sube una foto del platillo. GLM la guardará como pendiente y
            hará una estimación inicial que podrás revisar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => cameraInputRef.current?.click()}>
            <Camera size={17} />
            Tomar foto
          </Button>
          <Button type="button" variant="ghost" onClick={() => galleryInputRef.current?.click()}>
            <ImagePlus size={17} />
            Subir de galería
          </Button>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(event) => choose(event.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => choose(event.target.files?.[0])}
      />

      {prepared ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="overflow-hidden rounded-[1.35rem] border bg-white">
            <img
              src={prepared.previewUrl}
              alt="Vista previa de la comida seleccionada"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-between rounded-[1.35rem] border bg-card/80 p-4">
            <div>
              <p className="text-sm font-semibold">Vista previa lista</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                La comida se guardará como pendiente. Podrás marcarla como
                consumida después de revisarla.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Tamaño preparado: {formatBytes(prepared.blob.size)}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={save} disabled={pending}>
                {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {pending ? "Guardando..." : "Guardar pendiente"}
              </Button>
              <Button type="button" variant="ghost" onClick={clearPrepared} disabled={pending}>
                <X size={16} />
                Quitar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[1.35rem] border border-dashed bg-card/65 p-5 text-sm leading-6 text-muted-foreground">
          Selecciona una imagen para ver la vista previa antes de guardarla.
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {pending ? (
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <RotateCcw size={14} className="animate-spin" />
          Subiendo imagen y preparando análisis...
        </p>
      ) : null}
    </Card>
  );
}

async function compressImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, PHOTO_MEAL_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas no disponible.");
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const webp = await canvasToBlob(canvas, "image/webp", quality);
      if (webp && webp.size <= PHOTO_MEAL_MAX_STORED_BYTES) return webp;
    }

    const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.72);
    if (!jpeg) throw new Error("No fue posible comprimir.");
    return jpeg;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Imagen inválida."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function normalizeImageType(type: string): "image/jpeg" | "image/png" | "image/webp" {
  if (type === "image/png") return "image/png";
  if (type === "image/jpeg") return "image/jpeg";
  return "image/webp";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// src/lib/cloudinary.ts
export type CloudinaryUploadResult = {
  public_id?: string;
  secure_url?: string;
  url?: string;
  [k: string]: unknown;
};

type CloudinaryEnv = {
  cloudName: string;
  uploadPreset: string;
};

/**
 * Lee las variables de entorno sin romper el build.
 * Si algo falta, lo reportaremos cuando se intente subir.
 */
function readEnv(): CloudinaryEnv {
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "").trim();
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim();
  return { cloudName, uploadPreset };
}

/**
 * Sube una imagen a Cloudinary usando un preset UNSIGNED.
 * @param file   File/Blob o data URL. (Si le pasas string URL http(s), Cloudinary también acepta.)
 * @param folder Carpeta destino (opcional).
 * @returns      Respuesta de Cloudinary (incluye secure_url).
 */
export async function uploadImageToCloudinary(
  file: File | Blob | string,
  folder?: string
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = readEnv();

  if (!cloudName || !uploadPreset) {
    const missing = [
      !cloudName && "VITE_CLOUDINARY_CLOUD_NAME",
      !uploadPreset && "VITE_CLOUDINARY_UPLOAD_PRESET",
    ].filter(Boolean) as string[];
    throw new Error(
      `Cloudinary no está configurado. Faltan: ${missing.join(", ")}`
    );
  }

  const form = new FormData();
  form.append("file", file as any);
  form.append("upload_preset", uploadPreset);
  if (folder?.trim()) form.append("folder", folder.trim());

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: "POST",
    body: form,
  });

  const json = (await res.json()) as CloudinaryUploadResult & {
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(json.error?.message || "No se pudo subir la imagen.");
  }
  return json;
}

/** Útil para toggles en UI de settings, sin romper el build */
export function isCloudinaryConfigured(): boolean {
  const { cloudName, uploadPreset } = readEnv();
  return Boolean(cloudName && uploadPreset);
}

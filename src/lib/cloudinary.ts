// src/lib/cloudinary.ts
export type CloudinaryUploadResult = {
  public_id?: string;
  secure_url?: string;
  url?: string;
  [k: string]: unknown;
};

function must(v: string | undefined, name: string) {
  if (!v || !v.trim()) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

const CLOUD_NAME = must(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME, "VITE_CLOUDINARY_CLOUD_NAME");
const UPLOAD_PRESET = must(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET, "VITE_CLOUDINARY_UPLOAD_PRESET");

export async function uploadImageToCloudinary(file: File, folder?: string): Promise<CloudinaryUploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  if (folder?.trim()) form.append("folder", folder.trim());

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: "POST", body: form });
  const json = (await res.json()) as CloudinaryUploadResult & { error?: { message?: string } };

  if (!res.ok) throw new Error(json.error?.message || "No se pudo subir la imagen.");
  return json;
}

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

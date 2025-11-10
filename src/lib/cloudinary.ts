export type CloudinaryConfig = {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
};

let cachedConfig: CloudinaryConfig | null | undefined;

function parseCloudinaryUrl(url: string): CloudinaryConfig | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "cloudinary:") {
      return null;
    }

    const apiKey = decodeURIComponent(parsed.username).trim();
    const apiSecret = decodeURIComponent(parsed.password).trim();
    const cloudName = decodeURIComponent(parsed.hostname).trim();

    if (!apiKey || !apiSecret || !cloudName) {
      return null;
    }

    return { apiKey, apiSecret, cloudName };
  } catch (error) {
    console.error("No se pudo interpretar la URL de Cloudinary", error);
    return null;
  }
}

export function getCloudinaryConfig(): CloudinaryConfig | null {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  const raw =
    (typeof import.meta.env.VITE_CLOUDINARY_URL === "string" && import.meta.env.VITE_CLOUDINARY_URL) ||
    (typeof import.meta.env.CLOUDINARY_URL === "string" && import.meta.env.CLOUDINARY_URL) ||
    "";

  if (!raw) {
    cachedConfig = null;
    return cachedConfig;
  }

  cachedConfig = parseCloudinaryUrl(raw);
  return cachedConfig;
}

function buildSignaturePayload(params: Record<string, string | undefined>): string {
  return Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return typeof value === "string" && value.length > 0;
    })
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
}

async function sha1Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export type CloudinaryUploadResult = {
  public_id?: string;
  secure_url?: string;
  url?: string;
  [key: string]: unknown;
};

export async function uploadImageToCloudinary(
  file: File,
  options?: { folder?: string }
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      "Cloudinary no está configurado. Copia y pega en tu archivo .env el valor completo VITE_CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> tal como aparece en el panel."
    );
  }

  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("La API de crypto necesaria para firmar la solicitud no está disponible.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string> = {
    timestamp: String(timestamp),
  };

  if (options?.folder) {
    params.folder = options.folder;
  }

  const signaturePayload = buildSignaturePayload(params);
  const toSign = signaturePayload ? `${signaturePayload}${config.apiSecret}` : config.apiSecret;
  const signature = await sha1Hex(toSign);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", config.apiKey);
  formData.append("timestamp", String(timestamp));
  if (options?.folder) {
    formData.append("folder", options.folder);
  }
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as CloudinaryUploadResult & {
    error?: { message?: string };
  };

  if (!response.ok) {
    const message = data.error?.message ?? "No se pudo subir la imagen a Cloudinary.";
    if (response.status === 401) {
      throw new Error(
        `${message} Verifica que VITE_CLOUDINARY_URL contenga el api_key, api_secret y cloud_name correctos sin espacios adicionales.`
      );
    }

    throw new Error(message);
  }

  return data;
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

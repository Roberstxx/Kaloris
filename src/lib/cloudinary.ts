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

    const looksLikePlaceholder = (value: string): boolean => {
      const lower = value.toLowerCase();
      return (
        value.includes("{") ||
        value.includes("}") ||
        value.includes("<") ||
        value.includes(">") ||
        lower.includes("your-") ||
        lower.includes("your_")
      );
    };

    if ([apiKey, apiSecret, cloudName].some(looksLikePlaceholder)) {
      if (import.meta.env.DEV) {
        console.warn(
          "Cloudinary URL contiene placeholders. Copia el valor completo desde Settings → API Keys y reemplázalo en tu .env."
        );
      }
      return null;
    }

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

type SignatureParamValue = string | number | boolean | null | undefined;

function normalizeSignatureParams(params: Record<string, SignatureParamValue>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const key of Object.keys(params)) {
    if (key === "file") continue;

    const rawValue = params[key];
    if (rawValue === undefined || rawValue === null) continue;

    const value = typeof rawValue === "string" ? rawValue.trim() : String(rawValue);
    if (value.length === 0) continue;

    normalized[key] = value;
  }

  return normalized;
}

function buildSignaturePayload(params: Record<string, SignatureParamValue>): string {
  const normalized = normalizeSignatureParams(params);

  return Object.keys(normalized)
    .sort()
    .map((key) => `${key}=${normalized[key]}`)
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

type UploadOptions = {
  folder?: string;
  publicId?: string;
  invalidate?: boolean;
};

export async function uploadImageToCloudinary(
  file: File,
  options?: UploadOptions
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      "Cloudinary no está configurado. Copia y pega en tu archivo .env el valor completo VITE_CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> tal como aparece en el panel (sin llaves ni textos de ejemplo)."
    );
  }

  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("La API de crypto necesaria para firmar la solicitud no está disponible.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = options?.folder?.trim();
  const publicId = options?.publicId?.trim();
  const invalidate = options?.invalidate;

  const params = {
    folder,
    invalidate,
    public_id: publicId,
    timestamp,
  } satisfies Record<string, SignatureParamValue>;

  const signaturePayload = buildSignaturePayload(params);
  const toSign = signaturePayload ? `${signaturePayload}${config.apiSecret}` : config.apiSecret;
  const signature = await sha1Hex(toSign);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", config.apiKey);
  formData.append("timestamp", String(timestamp));
  if (folder) {
    formData.append("folder", folder);
  }
  if (publicId) {
    formData.append("public_id", publicId);
  }
  if (typeof invalidate === "boolean") {
    formData.append("invalidate", invalidate ? "true" : "false");
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
        `${message} Verifica que VITE_CLOUDINARY_URL contenga el api_key, api_secret y cloud_name reales (sin llaves ni placeholders) y sin espacios adicionales.`
      );
    }

    throw new Error(message);
  }

  return data;
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

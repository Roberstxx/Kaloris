// src/lib/dailyQuote.ts
const TZ = "America/Hermosillo";

const FALLBACK_QUOTES_ES: string[] = [
  "Tu constancia construye tu meta.",
  "Pequeños pasos diarios crean grandes cambios.",
  "La disciplina vence al talento cuando el talento no se disciplina.",
  "Hoy elige avanzar aunque sea un poco.",
  "Lo perfecto no supera a lo constante.",
  "Cada bocado es una decisión hacia tu objetivo.",
  "Hazlo por tu salud futura.",
  "Tu mejor versión te está esperando.",
  "La suma de tus hábitos define tu progreso.",
  "Eres más fuerte que tus excusas."
];

function dayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function fetchFromCustomApi(signal?: AbortSignal): Promise<string | null> {
  const url = (import.meta as any)?.env?.VITE_QUOTES_URL as string | undefined;
  if (!url) return null;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;

  // Soporta JSON {text:"..."} o texto plano
  try {
    const data = await res.json();
    if (typeof data === "string") return data;
    if (data && typeof data.text === "string") return data.text;
    if (Array.isArray(data) && typeof data[0] === "string") return data[0];
    return null;
  } catch {
    const txt = await res.text().catch(() => "");
    return txt?.trim() || null;
  }
}

function pickFallbackQuoteES(): string {
  return FALLBACK_QUOTES_ES[Math.floor(Math.random() * FALLBACK_QUOTES_ES.length)];
}

/** Frase ES cacheada por día (America/Hermosillo). */
export async function getDailyQuoteCachedES(): Promise<string> {
  const key = dayKey();
  const lsKey = `kaloris:quote:${key}`;

  const cached = localStorage.getItem(lsKey);
  if (cached) return cached;

  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), 3500);
  try {
    const fromApi = await fetchFromCustomApi(controller.signal);
    const quote = (fromApi?.trim()) || pickFallbackQuoteES();

    // Limpia días anteriores
    Object.keys(localStorage)
      .filter(k => k.startsWith("kaloris:quote:") && k !== lsKey)
      .forEach(k => localStorage.removeItem(k));

    localStorage.setItem(lsKey, quote);
    return quote;
  } catch {
    const last = Object.keys(localStorage)
      .filter(k => k.startsWith("kaloris:quote:"))
      .sort().reverse()[0];
    if (last) {
      const q = localStorage.getItem(last);
      if (q) return q;
    }
    const fallback = pickFallbackQuoteES();
    localStorage.setItem(lsKey, fallback);
    return fallback;
  } finally {
    clearTimeout(t);
  }
}

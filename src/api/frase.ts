// api/frase.ts
export const config = { runtime: "edge" };

const TZ = "America/Hermosillo";

// Frases en español (edítalas libremente)
const QUOTES_ES = [
  "Tu constancia construye tu meta.",
  "Pequeños pasos diarios crean grandes cambios.",
  "La disciplina vence al talento cuando el talento no se disciplina.",
  "Hoy elige avanzar aunque sea un poco.",
  "Lo perfecto no supera a lo constante.",
  "Cada bocado es una decisión hacia tu objetivo.",
  "Hazlo por tu salud futura.",
  "Tu mejor versión te está esperando.",
  "La suma de tus hábitos define tu progreso.",
  "Eres más fuerte que tus excusas.",
  "La constancia hace visible lo que el deseo inicia.",
  "Ordena tu día y tu día te ordenará a ti.",
  "La salud es la riqueza más grande que tienes.",
  "Cuidarte hoy es amar a tu futuro yo.",
  "Comer consciente es un acto de amor propio.",
];

function dayKey(date = new Date(), tz = TZ) {
  const parts = new Intl.DateTimeFormat("es-MX", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`; // YYYY-MM-DD
}

function pickQuoteForDate(key: string) {
  // Hash determinístico por fecha (mismo índice para todo el día)
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return QUOTES_ES[h % QUOTES_ES.length];
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60, s-maxage=60",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type",
      ...(init?.headers || {}),
    },
    status: init?.status ?? 200,
  });
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Content-Type",
      },
      status: 204,
    });
  }

  const url = new URL(req.url);
  const tz = url.searchParams.get("tz") || TZ;

  const key = dayKey(new Date(), tz);
  const text = pickQuoteForDate(key);

  return json({ text, date: key, tz });
}

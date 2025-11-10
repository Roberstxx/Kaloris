// src/utils/date.ts
const MX_TIMEZONE = "America/Mexico_City";

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MX_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: MX_TIMEZONE,
  weekday: "short",
});

const weekdayIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Devuelve la fecha LOCAL (America/Mexico_City) en formato ISO corto YYYY-MM-DD,
 * evitando errores por UTC o DST.
 */
export function getTodayISO(): string {
  return isoFormatter.format(new Date());
}

/**
 * Convierte Date -> ISO corto YYYY-MM-DD en zona horaria de México.
 */
export function toISODateMX(date: Date): string {
  return isoFormatter.format(date);
}

/**
 * Obtiene el índice del día de la semana (0=Domingo) respetando la zona horaria de México.
 */
export function getDayOfWeekMX(dateISO: string): number {
  const [year, month, day] = dateISO.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const weekdayPart = weekdayFormatter
    .formatToParts(utcDate)
    .find((part) => part.type === "weekday");

  if (weekdayPart) {
    const key = weekdayPart.value.slice(0, 3) as keyof typeof weekdayIndex;
    if (key in weekdayIndex) {
      return weekdayIndex[key];
    }
  }

  // Fallback seguro para Domingo
  return 0;
}

/**
 * Etiqueta dd/mm/yyyy para UI a partir de YYYY-MM-DD.
 */
export function getDateLabel(dateISO: string): string {
  const [y, m, d] = dateISO.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Últimos N días (incluye hoy) como ISO corto en la zona horaria de México.
 */
export function getLastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(toISODateMX(d));
  }
  return out.reverse();
}

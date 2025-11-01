// src/utils/date.ts
/**
 * Devuelve la fecha LOCAL (America/Hermosillo) en formato ISO corto YYYY-MM-DD,
 * evitando errores por UTC o DST.
 */
export function getTodayISO(): string {
  // Formateamos con en-CA para obtener orden YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Hermosillo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // ej. "2025-10-25"
}

/**
 * Convierte Date -> ISO corto YYYY-MM-DD en zona Hermosillo.
 */
export function toISODateHMO(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Hermosillo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}

/**
 * Etiqueta dd/mm/yyyy para UI a partir de YYYY-MM-DD.
 */
export function getDateLabel(dateISO: string): string {
  const [y, m, d] = dateISO.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Últimos N días (incluye hoy) como ISO corto en zona Hermosillo.
 */
export function getLastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(toISODateHMO(d));
  }
  return out.reverse();
}

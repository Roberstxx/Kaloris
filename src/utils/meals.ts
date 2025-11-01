import { IntakeEntry } from "../types";

export type MealSlot = "breakfast" | "lunch" | "dinner";

const mexicoCityHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Mexico_City",
  hour: "numeric",
  hour12: false,
});

const isMealSlot = (value: unknown): value is MealSlot =>
  value === "breakfast" || value === "lunch" || value === "dinner";

export const resolveMealSlot = (entry: IntakeEntry): MealSlot => {
  if (isMealSlot(entry.meal)) {
    return entry.meal;
  }
  if (entry.consumedAt) {
    return classifyMealByTime(new Date(entry.consumedAt));
  }
  return "dinner";
};

export function classifyMealByTime(date: Date): MealSlot {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "dinner";
  }

  const parts = mexicoCityHourFormatter.formatToParts(date);
  const hourPart = parts.find((p) => p.type === "hour");
  const hour = hourPart ? Number(hourPart.value) : date.getHours();

  if (hour >= 5 && hour < 12) return "breakfast"; // Desayuno típico: 5:00–11:59
  if (hour >= 12 && hour < 19) return "lunch"; // Comida fuerte: 12:00–18:59
  return "dinner"; // Cena y antojos nocturnos
}

export function normalizeConsumedAt(value?: string): string {
  const parsed = value ? new Date(value) : new Date();
  const validDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return validDate.toISOString();
}

export type ActivityLevel = "sedentario" | "ligero" | "moderado" | "intenso" | "muy_intenso";
export type Sex = "male" | "female";

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  sex?: Sex;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  activity?: ActivityLevel;
  tdee?: number;
  macros?: {
    carbPct: number;
    protPct: number;
    fatPct: number;
  };
  preferences?: UserPreferences;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  kcalPerServing: number;
  servingName: string;
  kcalPer100g?: number;
}

export interface IntakeEntry {
  id: string;
  userId: string;
  dateISO: string;
  foodId?: string;
  customName?: string;
  kcalPerUnit: number;
  units: number;
  consumedAt?: string;
  meal?: "breakfast" | "lunch" | "dinner";
}

export interface DailyLog {
  userId: string;
  dateISO: string;
  entries: IntakeEntry[];
  totalKcal: number;
}

export type UserPreferences = {
  theme?: 'light' | 'dark';
  locale?: string;
  notifications?: boolean;
};

export interface SessionState {
  user: User | null;
  isAuthenticated: boolean;
  profileComplete: boolean;
  needsProfile: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

export interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export type ProgressStatus = "ok" | "near" | "exceeded";

export interface WeeklyStatsSummary {
  periodStart: string;
  periodEnd: string;
  totalKcal: number;
  averageKcal: number;
  daysWithinTarget: number;
  compliance: number;
  trend: number;
  bestDay?: {
    dateISO: string;
    totalKcal: number;
  };
  updatedAt: string;
}

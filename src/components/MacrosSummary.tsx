// src/components/MacrosSummary.tsx
import React, { useMemo } from "react";
import { useSession, type AppUser } from "../context/SessionContext";
import { useIntake } from "../context/IntakeContext";
import styles from "./MacrosSummary.module.css";

type Split = { carbPct: number; protPct: number; fatPct: number };
type LegacyMacroSplit = { carbsPct: number; proteinPct: number; fatPct: number };

const DEFAULT_SPLIT: Split = { carbPct: 50, protPct: 25, fatPct: 25 };

function normalizeSplit(user: AppUser | null): Split {
  if (user?.macros) {
    return {
      carbPct: Number(user.macros.carbPct ?? DEFAULT_SPLIT.carbPct),
      protPct: Number(user.macros.protPct ?? DEFAULT_SPLIT.protPct),
      fatPct: Number(user.macros.fatPct ?? DEFAULT_SPLIT.fatPct),
    };
  }

  const legacy = (user as (AppUser & { macroSplit?: LegacyMacroSplit }) | null)?.macroSplit;
  if (legacy) {
    return {
      carbPct: Number(legacy.carbsPct ?? DEFAULT_SPLIT.carbPct),
      protPct: Number(legacy.proteinPct ?? DEFAULT_SPLIT.protPct),
      fatPct: Number(legacy.fatPct ?? DEFAULT_SPLIT.fatPct),
    };
  }

  return DEFAULT_SPLIT;
}

type MacroTargets = { carbs: number; protein: number; fat: number };

const computeTargets = (kcal: number, split: Split): MacroTargets => ({
  carbs: Math.round((kcal * (split.carbPct / 100)) / 4),
  protein: Math.round((kcal * (split.protPct / 100)) / 4),
  fat: Math.round((kcal * (split.fatPct / 100)) / 9),
});

type MacroRowProps = { label: string; val: number; goal: number };

const MacroRow: React.FC<MacroRowProps> = ({ label, val, goal }) => {
  const pct = Math.min(100, Math.round((val / Math.max(1, goal)) * 100));
  return (
    <div className={styles.row}>
      <div className={styles.rowHeader}>
        <span>{label}</span>
        <span>
          {val}/{goal} g
        </span>
      </div>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const MacrosSummary: React.FC = () => {
  const { user } = useSession();
  const { todayTotal } = useIntake();

  const split = useMemo(() => normalizeSplit(user), [user]);
  const tdee = Number(user?.tdee ?? 2000);

  const target = useMemo(() => computeTargets(tdee, split), [split, tdee]);
  const consumed = useMemo(() => computeTargets(todayTotal, split), [split, todayTotal]);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.root}>
      <MacroRow label="Carbohidratos" val={consumed.carbs} goal={target.carbs} />
      <MacroRow label="Proteína" val={consumed.protein} goal={target.protein} />
      <MacroRow label="Grasa" val={consumed.fat} goal={target.fat} />
      <div className={styles.meta}>
        Meta: {tdee} kcal · Split {split.carbPct}/{split.protPct}/{split.fatPct} %
      </div>
    </div>
  );
};

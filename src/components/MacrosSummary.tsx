// src/components/MacrosSummary.tsx
import React, { useMemo } from "react";
import { useSession } from "../context/SessionContext";
import { useIntake } from "../context/IntakeContext";
import styles from "./MacrosSummary.module.css";

type Split = { carbPct: number; protPct: number; fatPct: number };

function normalizeSplit(user: any): Split {
  // Compatible con user.macros {carbPct, protPct, fatPct}
  // y con el legado user.macroSplit {carbsPct, proteinPct, fatPct}
  if (user?.macros) return user.macros as Split;
  if (user?.macroSplit) {
    const { carbsPct, proteinPct, fatPct } = user.macroSplit;
    return { carbPct: carbsPct, protPct: proteinPct, fatPct };
  }
  return { carbPct: 50, protPct: 25, fatPct: 25 };
}

export const MacrosSummary: React.FC = () => {
  const { user } = useSession();
  const { todayTotal } = useIntake();
  if (!user) return null;

  const tdee = Number(user.tdee ?? 2000);
  const split = normalizeSplit(user);

  const target = useMemo(() => {
    const carbs = Math.round((tdee * (split.carbPct / 100)) / 4);
    const protein = Math.round((tdee * (split.protPct / 100)) / 4);
    const fat = Math.round((tdee * (split.fatPct / 100)) / 9);
    return { carbs, protein, fat };
  }, [tdee, split]);

  // Aproximación de macros consumidos a partir de kcal totales y el split elegido
  const consumed = useMemo(() => {
    const carbs = Math.round((todayTotal * (split.carbPct / 100)) / 4);
    const protein = Math.round((todayTotal * (split.protPct / 100)) / 4);
    const fat = Math.round((todayTotal * (split.fatPct / 100)) / 9);
    return { carbs, protein, fat };
  }, [todayTotal, split]);

  const Row = ({ label, val, goal }: { label: string; val: number; goal: number }) => {
    const pct = Math.min(100, Math.round((val / Math.max(1, goal)) * 100));
    return (
      <div className={styles.row}>
        <div className={styles.rowHeader}>
          <span>{label}</span>
          <span>{val}/{goal} g</span>
        </div>
        <div className={styles.bar}>
          {/* ancho dinámico sólo aquí (sin estilos inline extra) */}
          <div className={styles.fill} style={{ ["--w" as any]: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <Row label="Carbohidratos" val={consumed.carbs} goal={target.carbs} />
      <Row label="Proteína"       val={consumed.protein} goal={target.protein} />
      <Row label="Grasa"          val={consumed.fat} goal={target.fat} />
      <div className={styles.meta}>
        Meta: {tdee} kcal · Split {split.carbPct}/{split.protPct}/{split.fatPct} %
      </div>
    </div>
  );
};

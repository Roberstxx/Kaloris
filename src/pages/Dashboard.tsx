import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Undo,
  RotateCcw,
  Plus,
  BarChart3,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  Scale,
  AlertTriangle,
} from "lucide-react";

import { useSession } from "../context/SessionContext";
import { useIntake } from "../context/IntakeContext";

import { ProgressRing } from "../components/ProgressRing";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { FoodCard } from "../components/FoodCard";
import { IntakeItem } from "../components/IntakeItem";
import { MacrosSummary } from "../components/MacrosSummary";
import { StreakWidget } from "../components/StreakWidget";

import { FoodItem } from "../types";
import { getTodayISO } from "../utils/date";
import { exportToPDF } from "../utils/pdf";
import { resolveMealSlot } from "../utils/meals";
import type { MealSlot } from "../utils/meals";
import foodsData from "../data/foods.seed.json";
import { formatKcal } from "../utils/format";

import styles from "./Dashboard.module.css";
import AppHeader from "@/components/ui/AppHeader";
import { toast } from "@/components/ui/use-toast";

/** Normaliza texto para búsquedas */
const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

/* ===================== FRASES MOTIVADORAS ===================== */

type GoalTone = "ok" | "low" | "over";

const FALLBACK_QUOTES: Record<GoalTone, string[]> = {
  ok: [
    "¡Buen trabajo! Mantén este ritmo.",
    "Vas excelente, sigue así.",
    "Tu constancia está dando resultados.",
    "Estás tomando decisiones inteligentes hoy.",
  ],
  low: [
    "Aún tienes espacio para nutrirte mejor.",
    "Recuerda hacer una comida completa más tarde.",
    "Puedes aprovechar para agregar una porción de proteína.",
    "No descuides tu energía, tu cuerpo la necesita.",
  ],
  over: [
    "Lo importante es aprender del día de hoy.",
    "Mañana tienes otra oportunidad de hacerlo mejor.",
    "Una comida no define tu progreso.",
    "Respira, ajusta y sigue adelante.",
  ],
};

const MOTIVATION_TEXT_KEY = "kaloris:motivationText";
const MOTIVATION_TONE_KEY = "kaloris:motivationTone";
const MOTIVATION_DATE_KEY = "kaloris:motivationDate";

function pickRandom(arr: string[]): string {
  if (!arr.length) return "";
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();

  const {
    todayEntries, // entradas de hoy
    todayTotal, // kcal consumidas hoy
    addEntry,
    updateEntry,
    deleteEntry,
    resetToday,
    undoLast,
    getLogsForDateRange,
  } = useIntake();

  // ===== UI =====
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualFood, setManualFood] = useState<{ name: string; kcal: number; units: number }>({
    name: "",
    kcal: 0,
    units: 1,
  });

  // ===== Catálogo =====
  const foods: FoodItem[] = foodsData as FoodItem[];
  const foodsMap = useMemo(() => new Map(foods.map((f) => [f.id, f.name])), [foods]);

  const notifyEntry = (label: string, kcal: number) => {
    const safeLabel = label.trim() || "Alimento";
    toast({
      title: "¡Comida registrada!",
      description: `Has consumido ${safeLabel} · ${formatKcal(kcal)}`,
      duration: 2600,
    });
  };

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  // ===== Filtros =====
  const filteredFoods = useMemo(() => {
    const q = normalize(searchQuery);
    const sel = normalize(selectedCategory);
    return foods.filter((food) => {
      const matchesSearch = normalize(food.name).includes(q);
      const matchesCategory = sel === "todas" || normalize(food.category) === sel;
      return matchesSearch && matchesCategory;
    });
  }, [foods, searchQuery, selectedCategory]);

  // ===== Acciones =====
  const handleAddFood = (food: FoodItem) => {
    addEntry({ foodId: food.id, kcalPerUnit: food.kcalPerServing, units: 1 });
    notifyEntry(food.name, food.kcalPerServing);
  };

  const handleAddManual = () => {
    if (!manualFood.name.trim() || manualFood.kcal <= 0 || manualFood.units <= 0) return;
    addEntry({
      customName: manualFood.name,
      kcalPerUnit: manualFood.kcal,
      units: manualFood.units,
    });
    notifyEntry(manualFood.name, manualFood.kcal * manualFood.units);
    setManualFood({ name: "", kcal: 0, units: 1 });
    setShowAddManual(false);
  };

  const handleExportPDF = () => {
    if (!user) return;
    const logs = getLogsForDateRange([getTodayISO()]);
    exportToPDF({ user, date: getTodayISO(), dailyLog: logs[0], foodNames: foodsMap });
  };

  // ===== Totales por comida (dinámicos) =====
  const mealTotals = useMemo(() => {
    const totals: Record<MealSlot, number> = { breakfast: 0, lunch: 0, dinner: 0 };
    for (const e of todayEntries) {
      const kcal = e.kcalPerUnit * e.units;
      const key = resolveMealSlot(e);
      totals[key] += kcal;
    }
    return totals;
  }, [todayEntries]);

  if (!user) return null;
  const dailyGoal = user.tdee || 2304;
  const remaining = dailyGoal - todayTotal;

  /* ========= LÓGICA DEL ESTADO DE META + FRASE ========= */

  let tone: GoalTone = "ok";
  let statusTitle = "Dentro de tu meta";
  let StatusIcon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> = CheckCircle;

  if (todayTotal === 0) {
    tone = "low";
    statusTitle = "Aún no registras nada";
    StatusIcon = Clock;
  } else if (remaining > dailyGoal * 0.25) {
    // bastante por debajo
    tone = "low";
    statusTitle = "Por debajo de tu meta";
    StatusIcon = Scale;
  } else if (remaining >= 0) {
    // dentro o ligeramente debajo
    tone = "ok";
    statusTitle = "Dentro de tu meta";
    StatusIcon = CheckCircle;
  } else {
    // por encima
    tone = "over";
    statusTitle = "Sobre tu meta hoy";
    StatusIcon = AlertTriangle;
  }

  const [motivationText, setMotivationText] = useState<string>("");

  useEffect(() => {
    const today = getTodayISO();

    try {
      const storedText = localStorage.getItem(MOTIVATION_TEXT_KEY);
      const storedDate = localStorage.getItem(MOTIVATION_DATE_KEY);
      const storedTone = localStorage.getItem(MOTIVATION_TONE_KEY) as GoalTone | null;

      // Si ya hay una frase para hoy con el mismo "estado", la reutilizamos
      if (storedText && storedDate === today && storedTone === tone) {
        setMotivationText(storedText);
        return;
      }

      // Elegimos una nueva frase según el estado actual
      const pool = FALLBACK_QUOTES[tone] ?? FALLBACK_QUOTES.ok;
      const chosen = pickRandom(pool);
      setMotivationText(chosen);

      localStorage.setItem(MOTIVATION_TEXT_KEY, chosen);
      localStorage.setItem(MOTIVATION_DATE_KEY, today);
      localStorage.setItem(MOTIVATION_TONE_KEY, tone);
    } catch {
      // Si localStorage falla por cualquier motivo, al menos fijamos algo en memoria
      const pool = FALLBACK_QUOTES[tone] ?? FALLBACK_QUOTES.ok;
      setMotivationText(pickRandom(pool));
    }
  }, [tone]);

  // Texto dinámico con las kcal que faltan / se pasaron
  let deltaText = "";
  if (todayTotal > 0) {
    if (remaining > 0) {
      deltaText = `Te faltan ${remaining.toLocaleString("es-MX")} kcal para tu meta.`;
    } else if (remaining < 0) {
      deltaText = `Te pasaste ${Math.abs(remaining).toLocaleString("es-MX")} kcal de tu meta.`;
    }
  }

  const fullMotivation =
    deltaText && motivationText
      ? `${motivationText} ${deltaText}`
      : motivationText || deltaText;

  return (
    <div className={styles.page}>
      {/* ===== Header global ===== */}
      <AppHeader showStreakLink />

      {/* ===== Grid 1–2–1 ===== */}
      <main>
        <div className={styles.wide}>
          <div className={styles.grid121}>
            {/* ---------- IZQUIERDA: RESUMEN ---------- */}
            <aside className={styles.leftCol}>
              <h2 className={styles.hi}>¡Hola, {user.name || "Usuario"}!</h2>
              <p className={styles.metaLine}>
                Meta diaria: <strong>{dailyGoal} kcal</strong>
              </p>

              <div className={`${styles.widget} ${styles.widgetEnergy}`}>
                <h3>Consumo de Energía</h3>
                <div className={styles.ringWrap}>
                  <ProgressRing consumed={todayTotal} target={dailyGoal} />
                  <div className={styles.progressText}>
                    <span className={styles.consumed}>{todayTotal}</span>
                    <span className={styles.target}>
                      Restantes: {Math.max(remaining, 0)} kcal
                    </span>
                  </div>
                </div>

                <div
                  className={`${styles.goalStatus} ${
                    tone === "ok"
                      ? styles.goalStatusOk
                      : tone === "over"
                      ? styles.goalStatusOver
                      : styles.goalStatusLow
                  }`}
                >
                  <span className={styles.goalIcon}>
                    <StatusIcon size={20} />
                  </span>
                  <div>
                    <p className={styles.goalTitle}>{statusTitle}</p>
                    {fullMotivation && (
                      <p className={styles.goalMessage}>{fullMotivation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ---------- MACRONUTRIENTES DINÁMICOS ---------- */}
              <div className={styles.widget}>
                <h3>
                  <BarChart3 size={20} style={{ marginRight: 8 }} />
                  Macronutrientes
                </h3>
                <MacrosSummary />
              </div>
            </aside>

            {/* ---------- CENTRO: BUSCADOR + SUGERENCIAS ---------- */}
            <section className={styles.centerCol}>
              <div className={styles.widget}>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar alimentos, porción o marca…"
                />
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>

              <div className={`${styles.widget} ${styles.widgetCatalog}`}>
                <div className={styles.sectionHeaderTight}>
                  <h3>Sugerencias de Hoy</h3>
                  <div className={styles.actions}>
                    <button className="btn btn-secondary" onClick={() => setShowAddManual(true)}>
                      <Plus size={16} /> Alimento Manual
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportPDF}>
                      <Download size={16} /> Descargar PDF
                    </button>
                  </div>
                </div>

                {/* Form manual (cuando se abre) */}
                {showAddManual && (
                  <div className={styles.manualCard}>
                    <div className={styles.manualRow}>
                      <input
                        className="input"
                        placeholder="Nombre"
                        value={manualFood.name}
                        onChange={(e) =>
                          setManualFood({ ...manualFood, name: e.target.value })
                        }
                      />
                      <input
                        className="input"
                        type="number"
                        placeholder="kcal"
                        value={manualFood.kcal || ""}
                        onChange={(e) =>
                          setManualFood({
                            ...manualFood,
                            kcal: parseFloat(e.target.value) || 0,
                          })
                        }
                        style={{ width: 110 }}
                      />
                      <input
                        className="input"
                        type="number"
                        placeholder="Unidades"
                        value={manualFood.units || ""}
                        onChange={(e) =>
                          setManualFood({
                            ...manualFood,
                            units: parseFloat(e.target.value) || 1,
                          })
                        }
                        style={{ width: 120 }}
                      />
                      <button className="btn btn-primary" onClick={handleAddManual}>
                        Agregar
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setShowAddManual(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.foodGrid}>
                  {filteredFoods.map((food) => (
                    <FoodCard key={food.id} food={food} onAdd={() => handleAddFood(food)} />
                  ))}
                </div>

                {filteredFoods.length === 0 && (
                  <p className={styles.empty}>No hay resultados para tu búsqueda.</p>
                )}
              </div>
            </section>

            {/* ---------- DERECHA: DIARIO + TOTALES + RACHA ---------- */}
            <aside className={styles.rightCol}>
              <div className={styles.widget}>
                <h3>
                  <BookOpen size={20} style={{ marginRight: 8 }} />
                  Mi Diario de Hoy
                </h3>

                <div className={styles.intakeList}>
                  {todayEntries.map((entry) => (
                    <IntakeItem
                      key={entry.id}
                      entry={entry}
                      foodName={
                        entry.customName ||
                        foodsMap.get(entry.foodId || "") ||
                        "Alimento"
                      }
                      onUpdateUnits={(u) => updateEntry(entry.id, u)}
                      onDelete={() => deleteEntry(entry.id)}
                    />
                  ))}

                  {todayEntries.length === 0 && (
                    <p className={styles.empty}>Busca “manzana” o “arroz” para empezar.</p>
                  )}
                </div>
              </div>

              <div className={styles.widget}>
                <StreakWidget />
              </div>

              <div className={styles.widget}>
                <h3>
                  <TrendingUp size={20} style={{ marginRight: 8 }} />
                  Total por Comida
                </h3>
                <ul className={styles.mealSummary}>
                  <li>
                    <span>Desayuno</span>
                    <strong>
                      {mealTotals.breakfast ? `${mealTotals.breakfast} kcal` : "—"}
                    </strong>
                  </li>
                  <li>
                    <span>Comida</span>
                    <strong>
                      {mealTotals.lunch ? `${mealTotals.lunch} kcal` : "—"}
                    </strong>
                  </li>
                  <li>
                    <span>Cena</span>
                    <strong>
                      {mealTotals.dinner ? `${mealTotals.dinner} kcal` : "—"}
                    </strong>
                  </li>
                  <li className={styles.mealTotal}>
                    <span>TOTAL</span>
                    <strong>{todayTotal} kcal</strong>
                  </li>
                </ul>

                <div className={styles.sideActions}>
                  <button className="btn btn-secondary" onClick={undoLast}>
                    <Undo size={16} /> Deshacer
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      window.confirm("¿Resetear el día?") && resetToday()
                    }
                  >
                    <RotateCcw size={16} /> Reiniciar
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

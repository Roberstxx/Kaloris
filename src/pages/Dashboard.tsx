import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, History, Download, Undo, RotateCcw, Plus, Flame } from "lucide-react";

import { useSession } from "../context/SessionContext";
import { useIntake } from "../context/IntakeContext";

import { ProgressRing } from "../components/ProgressRing";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { FoodCard } from "../components/FoodCard";
import { IntakeItem } from "../components/IntakeItem";
import { ThemeToggle } from "../components/ThemeToggle";
import { MacrosSummary } from "../components/MacrosSummary";
import { StreakWidget } from "../components/StreakWidget"; // <-- NUEVA IMPORTACIÓN
import UserAvatar from "@/components/UserAvatar";

import { FoodItem } from "../types";
import { getTodayISO } from "../utils/date";
import { exportToPDF } from "../utils/pdf";
import { resolveMealSlot } from "../utils/meals";
import type { MealSlot } from "../utils/meals";
import foodsData from "../data/foods.seed.json";

import styles from "./Dashboard.module.css";

/** Normaliza texto para búsquedas */
const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

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
  };

  const handleAddManual = () => {
    if (!manualFood.name.trim() || manualFood.kcal <= 0 || manualFood.units <= 0) return;
    addEntry({
      customName: manualFood.name,
      kcalPerUnit: manualFood.kcal,
      units: manualFood.units,
    });
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

  return (
    <div className={styles.page}>
      {/* ===== Header ===== */}
      <header className={styles.header}>
        <div className={`container ${styles.wide}`}>
          <div className={styles.headerContent}>
            <h1 className={styles.logo}>Contador de Calorías</h1>
            <nav className={styles.nav}>
              <Link to="/dashboard" className={styles.navLink} title="Inicio">
                <Home size={18} />
              </Link>
              <Link to="/historial" className={styles.navLink} title="Historial">
                <History size={18} />
              </Link>
              {/* ENLACE A LA PÁGINA DE RACHA */}
              <Link to="/streak" className={styles.navLink} title="Racha de Metas">
                <Flame size={18} />
              </Link>
              {/* FIN ENLACE RACHA */}
              <Link
                to="/settings"
                className={`${styles.navLink} ${styles.navProfileLink}`}
                title="Configuración"
              >
                <UserAvatar
                  src={user.avatarUrl}
                  name={user.name}
                  username={user.username}
                  size={36}
                  className={styles.navAvatar}
                  imageClassName={styles.navAvatarImage}
                  fallbackClassName={styles.navAvatarFallback}
                />
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

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
                      Restantes: {Math.max(dailyGoal - todayTotal, 0)} kcal
                    </span>
                  </div>
                </div>

                <div className={styles.goalStatus}>
                  <span className={styles.goalIcon}>✅</span>
                  <p>{todayTotal <= dailyGoal ? "¡Dentro de tu meta!" : "Sobre tu meta hoy."}</p>
                </div>
              </div>

              {/* ---------- MACRONUTRIENTES DINÁMICOS ---------- */}
              <div className={styles.widget}>
                <h3>📊 Macronutrientes</h3>
                <MacrosSummary />
              </div>
              
              {/* ELIMINAMOS EL ENLACE RÁPIDO AQUÍ */}
              {/* <div className={styles.widget}>
                <Link to="/streak" className="btn btn-secondary" style={{ width: '100%' }}>
                  <Flame size={16} /> Ver mi Racha de Metas
                </Link>
              </div> */}

            </aside>

            {/* ---------- CENTRO: BUSCADOR + SUGERENCIAS ---------- */}
            <section className={styles.centerCol}>
              <div className={styles.widget}>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="🔍 Buscar alimentos, porción o marca…"
                />
                <CategoryFilter
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>

              <div className={styles.widget}>
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

            {/* ---------- DERECHA: DIARIO + TOTALES + RACHA (NUEVA POSICIÓN) ---------- */}
            <aside className={styles.rightCol}>
              <div className={styles.widget}>
                <h3>📜 Mi Diario de Hoy</h3>

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

              {/* WIDGET DE RACHA (NUEVA POSICIÓN) */}
              <div className={styles.widget}>
                 <StreakWidget /> 
              </div>

              <div className={styles.widget}>
                <h3>📈 Total por Comida</h3>
                <ul className={styles.mealSummary}>
                  <li>
                    <span>Desayuno</span>
                    <strong>{mealTotals.breakfast ? `${mealTotals.breakfast} kcal` : '—'}</strong>
                  </li>
                  <li>
                    <span>Comida</span>
                    <strong>{mealTotals.lunch ? `${mealTotals.lunch} kcal` : '—'}</strong>
                  </li>
                  <li>
                    <span>Cena</span>
                    <strong>{mealTotals.dinner ? `${mealTotals.dinner} kcal` : '—'}</strong>
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

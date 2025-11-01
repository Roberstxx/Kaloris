import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useIntake } from '../context/IntakeContext';
import { ProgressRing } from '../components/ProgressRing';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { FoodCard } from '../components/FoodCard';
import { IntakeItem } from '../components/IntakeItem';
import { ThemeToggle } from '../components/ThemeToggle';
import { Home, History, Settings, Download, Undo, RotateCcw, Plus } from 'lucide-react';
import { FoodItem } from '../types';
import { getTodayISO } from '../utils/date';
import { exportToPDF } from '../utils/pdf';
import foodsData from '../data/foods.seed.json';
import styles from './Dashboard.module.css';

const normalize = (s: string) => (s || '').toLowerCase().trim();

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();
  const {
    todayEntries,
    todayTotal,
    addEntry,
    updateEntry,
    deleteEntry,
    resetToday,
    undoLast,
    getLogsForDateRange
  } = useIntake();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualFood, setManualFood] = useState({ name: '', kcal: 0, units: 1 });

  const foods: FoodItem[] = foodsData as FoodItem[];
  const foodsMap = useMemo(() => new Map(foods.map(f => [f.id, f.name])), [foods]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // ✅ Mismo filtro que antes, pero más robusto
  const filteredFoods = useMemo(() => {
    const q = normalize(searchQuery);
    const selected = normalize(selectedCategory);
    return foods
      .filter(food => {
        const matchesSearch = normalize(food.name).includes(q);
        const matchesCategory =
          selected === 'todas' || normalize(food.category) === selected;
        return matchesSearch && matchesCategory;
      })
      .slice(0, 10);
  }, [foods, searchQuery, selectedCategory]);

  const handleAddFood = (food: FoodItem) => {
    addEntry({ foodId: food.id, kcalPerUnit: food.kcalPerServing, units: 1 });
  };

  const handleAddManual = () => {
    if (manualFood.name && manualFood.kcal > 0) {
      addEntry({
        customName: manualFood.name,
        kcalPerUnit: manualFood.kcal,
        units: manualFood.units
      });
      setManualFood({ name: '', kcal: 0, units: 1 });
      setShowAddManual(false);
    }
  };

  const handleExportPDF = () => {
    if (!user) return;
    const today = getTodayISO();
    const logs = getLogsForDateRange([today]);
    exportToPDF({ user, date: today, dailyLog: logs[0], foodNames: foodsMap });
  };

  if (!user) return null;

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div
          className="container"
          style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem'
          }}
        >
          <div className={styles.headerContent}>
            <h1 className={styles.logo}>Contador de Calorías</h1>
            <nav className={styles.nav}>
              <Link to="/dashboard" className={styles.navLink}><Home size={20} /></Link>
              <Link to="/historial" className={styles.navLink}><History size={20} /></Link>
              <Link to="/settings" className={styles.navLink}><Settings size={20} /></Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        className="container"
        style={{
          maxWidth: '100%',
          width: '100%',
          margin: '0 auto',
          paddingTop: '2rem',
          paddingBottom: '3rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem'
        }}
      >
        {/* Responsive grid */}
        <div className={styles.responsiveGrid}>
          {/* IZQUIERDA */}
          <div className={styles.leftSticky}>
            <section className={styles.hero}>
              <h2>¡Hola, {user.name}!</h2>
              <p>Tu meta diaria: <strong>{user.tdee || 2000} kcal</strong></p>
            </section>

            <ProgressRing consumed={todayTotal} target={user.tdee || 2000} />
          </div>

          {/* DERECHA */}
          <div className={styles.rightFlow}>
            {/* Buscar alimentos */}
            <section className={styles.section}>
              <h3>Buscar Alimentos</h3>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              <div className={styles.foodGrid}>
                {filteredFoods.map(food => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    onAdd={() => handleAddFood(food)}
                  />
                ))}
              </div>
              {filteredFoods.length === 0 && (
                <p className={styles.empty}>No hay resultados para tu búsqueda.</p>
              )}
            </section>

            {/* Consumo de hoy */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Consumo de Hoy</h3>
                <div className={styles.actions}>
                  <button className="btn btn-secondary" onClick={undoLast}>
                    <Undo size={18} />Deshacer
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowAddManual(!showAddManual)}
                  >
                    <Plus size={18} />Manual
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportPDF}
                  >
                    <Download size={18} />PDF
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      window.confirm('¿Resetear el día?') && resetToday()
                    }
                    title="Resetear día"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              {showAddManual && (
                <div className={styles.manualForm}>
                  <input
                    className="input"
                    placeholder="Nombre"
                    value={manualFood.name}
                    onChange={e =>
                      setManualFood({ ...manualFood, name: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Kcal"
                    value={manualFood.kcal || ''}
                    onChange={e =>
                      setManualFood({
                        ...manualFood,
                        kcal: parseFloat(e.target.value) || 0
                      })
                    }
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAddManual}
                  >
                    Agregar
                  </button>
                </div>
              )}

              <div className={styles.intakeList}>
                {todayEntries.map(entry => (
                  <IntakeItem
                    key={entry.id}
                    entry={entry}
                    foodName={
                      entry.customName ||
                      foodsMap.get(entry.foodId || '') ||
                      'Alimento'
                    }
                    onUpdateUnits={units => updateEntry(entry.id, units)}
                    onDelete={() => deleteEntry(entry.id)}
                  />
                ))}
                {todayEntries.length === 0 && (
                  <p className={styles.empty}>
                    Busca "manzana" o "arroz" para empezar.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

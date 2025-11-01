import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useCaloriesCalculator } from "../hooks/useCaloriesCalculator";
import { ActivityLevel, Sex } from "../types";
import { validatePhysicalData } from "../utils/validators";
import { Calculator } from "lucide-react";
import styles from "./Registro.module.css";

const Registro = () => {
  const navigate = useNavigate();
  const { user, updateProfile, isAuthenticated, needsProfile } = useSession();
  const { calculateTDEE } = useCaloriesCalculator();
  const [formData, setFormData] = useState({
    sex: "male" as Sex,
    age: 25,
    weightKg: 70,
    heightCm: 170,
    activity: "moderado" as ActivityLevel,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!needsProfile) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, needsProfile, navigate]);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      sex: (user.sex as Sex) ?? prev.sex,
      age: user.age ?? prev.age,
      weightKg: user.weightKg ?? prev.weightKg,
      heightCm: user.heightCm ?? prev.heightCm,
      activity: (user.activity as ActivityLevel) ?? prev.activity,
    }));
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = validatePhysicalData(formData);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const tdee = calculateTDEE(
      formData.weightKg,
      formData.heightCm,
      formData.age,
      formData.sex,
      formData.activity
    );

    updateProfile({ ...formData, tdee });
    navigate("/dashboard");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Datos Físicos</h1>
          <p className={styles.subtitle}>Calcula tu meta calórica diaria</p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sex">
              Sexo
            </label>
            <select
              id="sex"
              className={styles.select}
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value as Sex })}
            >
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="age">
              Edad (años)
            </label>
            <input
              id="age"
              type="number"
              className={styles.input}
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: Number.parseInt(e.target.value, 10) || 0 })
              }
              required
              min={1}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="weight">
              Peso (kg)
            </label>
            <input
              id="weight"
              type="number"
              className={styles.input}
              value={formData.weightKg}
              onChange={(e) =>
                setFormData({ ...formData, weightKg: Number.parseFloat(e.target.value) || 0 })
              }
              step="0.1"
              required
              min={1}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="height">
              Altura (cm)
            </label>
            <input
              id="height"
              type="number"
              className={styles.input}
              value={formData.heightCm}
              onChange={(e) =>
                setFormData({ ...formData, heightCm: Number.parseFloat(e.target.value) || 0 })
              }
              required
              min={1}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="activity">
              Nivel de Actividad
            </label>
            <select
              id="activity"
              className={styles.select}
              value={formData.activity}
              onChange={(e) =>
                setFormData({ ...formData, activity: e.target.value as ActivityLevel })
              }
            >
              <option value="sedentario">Sedentario</option>
              <option value="ligero">Ligero</option>
              <option value="moderado">Moderado</option>
              <option value="intenso">Intenso</option>
              <option value="muy_intenso">Muy Intenso</option>
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button}>
            <span className={styles.icon}>
              <Calculator size={20} />
            </span>
            Calcular y Continuar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registro;

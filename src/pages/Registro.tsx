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
  type PhysicalFormState = {
    sex: Sex;
    age: string;
    weightKg: string;
    heightCm: string;
    activity: ActivityLevel;
  };

  const [formData, setFormData] = useState<PhysicalFormState>({
    sex: "male",
    age: "",
    weightKg: "",
    heightCm: "",
    activity: "moderado",
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
      age: user.age ? String(user.age) : prev.age,
      weightKg: user.weightKg ? String(user.weightKg) : prev.weightKg,
      heightCm: user.heightCm ? String(user.heightCm) : prev.heightCm,
      activity: (user.activity as ActivityLevel) ?? prev.activity,
    }));
  }, [user]);

  const handleAgeChange = (value: string) => {
    if (/^\d{0,3}$/.test(value)) {
      setFormData((prev) => ({ ...prev, age: value }));
    }
  };

  const handleWeightChange = (value: string) => {
    if (/^\d{0,3}(\.\d{0,2})?$/.test(value)) {
      setFormData((prev) => ({ ...prev, weightKg: value }));
    }
  };

  const handleHeightChange = (value: string) => {
    if (/^\d{0,3}$/.test(value)) {
      setFormData((prev) => ({ ...prev, heightCm: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const age = Number.parseInt(formData.age, 10);
    const weightKg = Number.parseFloat(formData.weightKg);
    const heightCm = Number.parseFloat(formData.heightCm);

    if (!formData.age || Number.isNaN(age)) {
      setError("Ingresa una edad válida.");
      return;
    }

    if (!formData.weightKg || Number.isNaN(weightKg)) {
      setError("Ingresa un peso válido.");
      return;
    }

    if (!formData.heightCm || Number.isNaN(heightCm)) {
      setError("Ingresa una altura válida.");
      return;
    }

    const validation = validatePhysicalData({ age, weightKg, heightCm });
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const tdee = calculateTDEE(weightKg, heightCm, age, formData.sex, formData.activity);

    updateProfile({
      sex: formData.sex,
      age,
      weightKg,
      heightCm,
      activity: formData.activity,
      tdee,
    });
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
              type="text"
              inputMode="numeric"
              pattern="\d*"
              className={styles.input}
              value={formData.age}
              onChange={(e) => handleAgeChange(e.target.value)}
              placeholder="Ingresa tu edad"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="weight">
              Peso (kg)
            </label>
            <input
              id="weight"
              type="text"
              inputMode="decimal"
              className={styles.input}
              value={formData.weightKg}
              onChange={(e) => handleWeightChange(e.target.value.replace(',', '.'))}
              placeholder="Ingresa tu peso"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="height">
              Altura (cm)
            </label>
            <input
              id="height"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              className={styles.input}
              value={formData.heightCm}
              onChange={(e) => handleHeightChange(e.target.value)}
              placeholder="Ingresa tu altura"
              required
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

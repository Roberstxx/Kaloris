import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useCaloriesCalculator } from '../hooks/useCaloriesCalculator';
import { ActivityLevel, Sex } from '../types';
import { validatePhysicalData } from '../utils/validators';
import { Calculator } from 'lucide-react';
import styles from './Login.module.css';

const Registro = () => {
  const navigate = useNavigate();
  const { user, updateProfile, isAuthenticated } = useSession();
  const { calculateTDEE } = useCaloriesCalculator();
  const [formData, setFormData] = useState({
    sex: 'male' as Sex,
    age: 25,
    weightKg: 70,
    heightCm: 170,
    activity: 'moderado' as ActivityLevel,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
    navigate('/dashboard');
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Datos Físicos</h1>
          <p>Calcula tu meta calórica diaria</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className="label">Sexo</label>
            <select
              className="input"
              value={formData.sex}
              onChange={(e) => setFormData({...formData, sex: e.target.value as Sex})}
            >
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </div>
          <div>
            <label className="label">Edad (años)</label>
            <input
              type="number"
              className="input"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
              required
            />
          </div>
          <div>
            <label className="label">Peso (kg)</label>
            <input
              type="number"
              className="input"
              value={formData.weightKg}
              onChange={(e) => setFormData({...formData, weightKg: parseFloat(e.target.value)})}
              step="0.1"
              required
            />
          </div>
          <div>
            <label className="label">Altura (cm)</label>
            <input
              type="number"
              className="input"
              value={formData.heightCm}
              onChange={(e) => setFormData({...formData, heightCm: parseFloat(e.target.value)})}
              required
            />
          </div>
          <div>
            <label className="label">Nivel de Actividad</label>
            <select
              className="input"
              value={formData.activity}
              onChange={(e) => setFormData({...formData, activity: e.target.value as ActivityLevel})}
            >
              <option value="sedentario">Sedentario</option>
              <option value="ligero">Ligero</option>
              <option value="moderado">Moderado</option>
              <option value="intenso">Intenso</option>
              <option value="muy_intenso">Muy Intenso</option>
            </select>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn btn-primary">
            <Calculator size={20} />
            Calcular y Continuar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registro;

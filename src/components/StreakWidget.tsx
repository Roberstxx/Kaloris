import React from 'react';
import { Flame } from 'lucide-react';
import { useIntake } from '../context/IntakeContext';
import styles from './StreakWidget.module.css';

export const StreakWidget: React.FC = () => {
  // Ya corregido: useIntake expone weeklyStats que tiene currentStreak y longestStreak
  const { weeklyStats } = useIntake();
  const currentStreak = weeklyStats.currentStreak;
  const longestStreak = weeklyStats.longestStreak;
  
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <Flame />
        <span>Racha Calórica Diaria</span>
      </div>
      <p className={styles.value}>{currentStreak}</p>
      <p className={styles.subtext}>
        {currentStreak === 1 ? 'día consecutivo' : 'días consecutivos'} en meta
      </p>
      <div className={styles.longestStreak}>
        Racha máxima: <span>{longestStreak}</span> días
      </div>
    </div>
  );
};
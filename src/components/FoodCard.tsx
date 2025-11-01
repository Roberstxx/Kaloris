import React from 'react';
import { Plus } from 'lucide-react';
import { FoodItem } from '../types';
import { formatKcal } from '../utils/format';
import styles from './FoodCard.module.css';

interface FoodCardProps {
  food: FoodItem;
  onAdd: () => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, onAdd }) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h4 className={styles.name}>{food.name}</h4>
        <p className={styles.category}>{food.category}</p>
        <div className={styles.info}>
          <span className={styles.serving}>{food.servingName}</span>
          <span className={styles.kcal}>{formatKcal(food.kcalPerServing)}</span>
        </div>
      </div>
      <button className={styles.addBtn} onClick={onAdd} aria-label={`Agregar ${food.name}`}>
        <Plus size={20} />
      </button>
    </div>
  );
};

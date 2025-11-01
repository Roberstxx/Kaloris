import React from 'react';
import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
  'Todas',
  'Cereales sin grasa',
  'Cereales con grasa',
  'Verduras libres',
  'Verduras II',
  'Frutas',
  'AOA muy bajo en grasa',
  'AOA bajo en grasa',
  'AOA moderado en grasa',
  'AOA alto en grasa',
  'Leche descremada',
  'Leche semidescremada',
  'Leche entera',
  'Leguminosas',
  'Grasa monoinsaturada',
  'Grasa poliinsaturada',
  'Grasa saturada',
  'Azúcares',
  'Libres de energía',
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onSelectCategory 
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.chips}>
        {CATEGORIES.map(category => (
          <button
            key={category}
            className={`${styles.chip} ${selectedCategory === category ? styles.active : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { IntakeEntry } from '../types';
import { formatKcal } from '../utils/format';
import styles from './IntakeItem.module.css';

interface IntakeItemProps {
  entry: IntakeEntry;
  foodName: string;
  onUpdateUnits: (units: number) => void;
  onDelete: () => void;
}

export const IntakeItem: React.FC<IntakeItemProps> = ({
  entry,
  foodName,
  onUpdateUnits,
  onDelete,
}) => {
  const [units, setUnits] = useState(entry.units);
  const totalKcal = entry.kcalPerUnit * units;

  useEffect(() => {
    setUnits(entry.units);
  }, [entry.units]);

  const handleIncrement = () => {
    const newUnits = units + 1;
    setUnits(newUnits);
    onUpdateUnits(newUnits);
  };

  const handleDecrement = () => {
    if (units > 0.5) {
      const newUnits = units - 1;
      setUnits(newUnits);
      onUpdateUnits(newUnits);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setUnits(value);
  };

  const handleInputBlur = () => {
    const finalUnits = Math.max(0.5, units);
    setUnits(finalUnits);
    onUpdateUnits(finalUnits);
  };

  return (
    <div className={styles.item}>
      <div className={styles.content}>
        <h5 className={styles.name}>{foodName}</h5>
        <div className={styles.controls}>
          <button 
            className={styles.controlBtn} 
            onClick={handleDecrement}
            aria-label="Disminuir porciones"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            className={styles.unitsInput}
            value={units}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min="0.5"
            step="0.5"
            aria-label="Número de porciones"
          />
          <button 
            className={styles.controlBtn} 
            onClick={handleIncrement}
            aria-label="Aumentar porciones"
          >
            <Plus size={16} />
          </button>
        </div>
        <span className={styles.kcal}>{formatKcal(totalKcal)}</span>
      </div>
      <button 
        className={styles.deleteBtn} 
        onClick={onDelete}
        aria-label={`Eliminar ${foodName}`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

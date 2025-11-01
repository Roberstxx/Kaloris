import React, { useMemo } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { ProgressStatus } from '../types';
import { formatKcal } from '../utils/format';
import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  consumed: number;
  target: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ consumed, target }) => {
  const percentage = target > 0 ? Math.min((consumed / target) * 100, 200) : 0;
  
  const status: ProgressStatus = useMemo(() => {
    const pct = (consumed / target) * 100;
    if (pct > 105) return 'exceeded';
    if (pct >= 95) return 'near';
    return 'ok';
  }, [consumed, target]);

  const colors = {
    ok: 'hsl(158, 60%, 45%)',
    near: 'hsl(28, 90%, 55%)',
    exceeded: 'hsl(0, 75%, 55%)',
  };

  const messages = {
    ok: [
      `¡Buen trabajo! Te faltan ${formatKcal(target - consumed)} para tu meta.`,
      `Vas muy bien, quedan ${formatKcal(target - consumed)}.`,
      `Excelente control. Restan ${formatKcal(target - consumed)}.`,
    ],
    near: [
      'Estás cerca de tu límite, ajusta tus porciones.',
      '¡Cuidado! Ya casi alcanzas tu meta diaria.',
      'Muy cerca del objetivo. Considera porciones más pequeñas.',
    ],
    exceeded: [
      `Excediste por ${formatKcal(consumed - target)}. Mañana será mejor 🙂`,
      `Sobrepasaste tu meta por ${formatKcal(consumed - target)}. ¡No te preocupes!`,
      `${formatKcal(consumed - target)} de exceso hoy. Todos tenemos días así.`,
    ],
  };

  const getMessage = () => {
    const msgList = messages[status];
    return msgList[Math.floor(Math.random() * msgList.length)];
  };

  const statusLabels = {
    ok: 'Dentro de tu meta',
    near: 'Cerca del límite',
    exceeded: 'Meta excedida',
  };

  return (
    <div className={styles.container}>
      <div className={styles.ring}>
        <CircularProgressbar
          value={percentage}
          maxValue={100}
          strokeWidth={8}
          styles={buildStyles({
            pathColor: colors[status],
            trailColor: 'var(--border)',
            pathTransitionDuration: 0.5,
          })}
        />
        <div className={styles.center}>
          <div className={styles.numbers}>
            <span className={styles.consumed}>{Math.round(consumed)}</span>
            <span className={styles.divider}>/</span>
            <span className={styles.target}>{Math.round(target)}</span>
          </div>
          <span className={styles.unit}>kcal</span>
        </div>
      </div>
      
      <div className={`${styles.status} ${styles[status]}`} role="status" aria-live="polite">
        <span className={styles.statusLabel}>{statusLabels[status]}</span>
        <p className={styles.message}>{getMessage()}</p>
      </div>
    </div>
  );
};

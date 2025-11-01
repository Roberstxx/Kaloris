import React from "react";
import styles from "./KpiCard.module.css";

interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtext }) => {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <h4 className={styles.value}>{value}</h4>
      {subtext && <p className={styles.sub}>{subtext}</p>}
    </div>
  );
};

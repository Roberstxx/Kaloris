import React from "react";
import styles from "./DashboardLayout.module.css";

interface DashboardLayoutProps {
  top?: React.ReactNode;        // ✅ nuevo
  overview: React.ReactNode;
  workspace: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  top,
  overview,
  workspace,
}) => {
  return (
    <div className={styles.layout}>
      {top && <div className={styles.top}>{top}</div>}
      <aside className={styles.overview}>{overview}</aside>
      <section className={styles.workspace}>{workspace}</section>
    </div>
  );
};

import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useIntake } from '../context/IntakeContext';
import { HistoryChart } from '../components/HistoryChart';
import { ThemeToggle } from '../components/ThemeToggle';
import { Home, History, Settings } from 'lucide-react';
import { getLastNDays, getDateLabel } from '../utils/date';
import { formatKcal } from '../utils/format';
import styles from './Dashboard.module.css';

const Historial = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSession();
  const { getLogsForDateRange } = useIntake();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const dates = getLastNDays(7);
  const logs = getLogsForDateRange(dates);

  if (!user) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerContent}>
            <h1 className={styles.logo}>Historial</h1>
            <nav className={styles.nav}>
              <Link to="/dashboard" className={styles.navLink}><Home size={20} /></Link>
              <Link to="/historial" className={styles.navLink}><History size={20} /></Link>
              <Link to="/settings" className={styles.navLink}><Settings size={20} /></Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <h2>Últimos 7 días</h2>
        <HistoryChart logs={logs} targetKcal={user.tdee || 2000} />
        
        <div style={{ marginTop: '2rem' }}>
          {logs.map(log => (
            <div key={log.dateISO} className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{getDateLabel(log.dateISO)}</strong>
                <span>{formatKcal(log.totalKcal)}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Historial;

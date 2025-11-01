import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Home, History, Settings, LogOut } from 'lucide-react';
import styles from './Dashboard.module.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useSession();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerContent}>
            <h1 className={styles.logo}>Ajustes</h1>
            <nav className={styles.nav}>
              <Link to="/dashboard" className={styles.navLink}><Home size={20} /></Link>
              <Link to="/historial" className={styles.navLink}><History size={20} /></Link>
              <Link to="/settings" className={styles.navLink}><Settings size={20} /></Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', maxWidth: '600px' }}>
        <div className="card">
          <h3>Perfil</h3>
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Usuario:</strong> {user.username}</p>
          <p><strong>Meta TDEE:</strong> {user.tdee || 2000} kcal</p>
          <Link to="/registro" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Editar Datos Físicos</Link>
        </div>

        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Sesión</h3>
          <button onClick={handleLogout} className="btn btn-danger">
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

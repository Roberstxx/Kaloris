import React from "react";
import { Link } from "react-router-dom";
import { Home, History, Flame } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import UserAvatar from "@/components/UserAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils"; 

// Reutilizamos las clases del header que ya existen en Dashboard.module.css
import styles from "@/pages/Dashboard.module.css";

type AppHeaderProps = {
  /** Texto del título (por defecto: Contador de Calorías) */
  title?: string;
  /** Mostrar enlace a la página de racha (🔥) */
  showStreakLink?: boolean;
};

const AppHeader: React.FC<AppHeaderProps> = ({ title = "Contador de Calorías", showStreakLink }) => {
  const { user } = useSession();

  // Función auxiliar para verificar si una ruta está activa
  const isActive = (path: string) => window.location.pathname === path;

  return (
    <>
      {/* ========================================================
          A) BARRA SUPERIOR (Logo + Avatar a la Derecha)
          ======================================================== */}
      <header className={styles.header}>
        <div className={`container ${styles.wide}`}>
          <div className={styles.headerContent}>
            
            {/* Título/Logo */}
            <h1 className={styles.logo}>{title}</h1>
            
            {/* Contenedor de Navegación (Solo el Avatar en móvil, completo en desktop) */}
            <nav className={styles.nav}>
              
              {/* Navegación completa (Visible en Desktop, oculta en Mobile) */}
              <Link to="/dashboard" className={cn(styles.navLink, styles.desktopNav)} title="Inicio">
                <Home size={18} />
              </Link>
              <Link to="/historial" className={cn(styles.navLink, styles.desktopNav)} title="Historial">
                <History size={18} />
              </Link>
              {showStreakLink && (
                <Link to="/streak" className={cn(styles.navLink, styles.desktopNav)} title="Racha de Metas">
                  <Flame size={18} />
                </Link>
              )}
              {/* ¡ELIMINADO! ThemeToggle ya no va en el header superior */}
              {/* <ThemeToggle className={styles.desktopNav} /> */}
              
              {/* Avatar Link (Ahora siempre visible y en la esquina superior derecha) */}
              <Link
                to="/settings"
                className={cn(styles.navLink, styles.navProfileLink)}
                title="Configuración"
              >
                <UserAvatar
                  src={user?.avatarUrl}
                  name={user?.name}
                  username={user?.username}
                  size={36}
                  className={styles.navAvatar}
                  imageClassName={styles.navAvatarImage}
                  fallbackClassName={styles.navAvatarFallback}
                />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ========================================================
          B) BARRA INFERIOR MÓVIL (Con Home, Historial, Racha y Modo)
          ======================================================== */}
      <div className={styles.mobileBottomNav} id="mobile-nav-root">
        {/* Enlace de Dashboard */}
        <Link 
            to="/dashboard" 
            className={cn(styles.bottomLink, isActive("/dashboard") && styles.active)} 
            title="Inicio" 
            aria-current={isActive("/dashboard") ? "page" : undefined}
        >
          <Home size={24} />
          <span>Inicio</span>
        </Link>
        
        {/* Enlace de Historial */}
        <Link 
            to="/historial" 
            className={cn(styles.bottomLink, isActive("/historial") && styles.active)} 
            title="Historial" 
            aria-current={isActive("/historial") ? "page" : undefined}
        >
          <History size={24} />
          <span>Historial</span>
        </Link>
        
        {/* Enlace de Racha (Opcional) */}
        {showStreakLink && (
          <Link 
            to="/streak" 
            className={cn(styles.bottomLink, isActive("/streak") && styles.active)} 
            title="Racha" 
            aria-current={isActive("/streak") ? "page" : undefined}
          >
            <Flame size={24} />
            <span>Racha</span>
          </Link>
        )}
        
        {/* Toggle de Tema */}
        <div className={styles.bottomThemeToggle}>
             <ThemeToggle />
             <span>Modo</span>
        </div>
      </div>
    </>
  );
};

export default AppHeader;

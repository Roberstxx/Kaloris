import React from "react";
import { Link } from "react-router-dom";
import { Home, History, Flame } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import UserAvatar from "@/components/UserAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  return (
    <header className={styles.header}>
      <div className={`container ${styles.wide}`}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>{title}</h1>
          <nav className={styles.nav}>
            <Link to="/dashboard" className={styles.navLink} title="Inicio">
              <Home size={18} />
            </Link>
            <Link to="/historial" className={styles.navLink} title="Historial">
              <History size={18} />
            </Link>

            {showStreakLink && (
              <Link to="/streak" className={styles.navLink} title="Racha de Metas">
                <Flame size={18} />
              </Link>
            )}

            <Link
              to="/settings"
              className={`${styles.navLink} ${styles.navProfileLink}`}
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

            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

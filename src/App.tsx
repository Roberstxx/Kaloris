import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SessionProvider } from "./context/SessionContext";
import { IntakeProvider } from "./context/IntakeContext";
import RequireAuth from "./lib/RequireAuth";
import RequireProfile from "./lib/RequireProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Historial from "./pages/Historial";
import Settings from "./pages/Settings";
import StreakPage from "./pages/Streak";
import SplashLoader from "./pages/SplashLoader"; // ⬅️ NUEVO

const App = () => (
  <SessionProvider>
    <ThemeProvider>
      <IntakeProvider>
        <BrowserRouter>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Splash (página de loader) */}
            <Route path="/splash" element={<SplashLoader />} />

            {/* Solo autenticación (para completar perfil) */}
            <Route path="/registro" element={<RequireAuth><Registro /></RequireAuth>} />

            {/* Perfil completo */}
            <Route path="/dashboard" element={<RequireProfile><Dashboard /></RequireProfile>} />
            <Route path="/historial" element={<RequireProfile><Historial /></RequireProfile>} />
            <Route path="/settings" element={<RequireProfile><Settings /></RequireProfile>} />
            <Route path="/streak" element={<RequireProfile><StreakPage /></RequireProfile>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </IntakeProvider>
    </ThemeProvider>
  </SessionProvider>
);

export default App;

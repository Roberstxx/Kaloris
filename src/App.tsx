// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SessionProvider } from "./context/SessionContext";
import { IntakeProvider } from "./context/IntakeContext";
import RequireAuth from "./lib/RequireAuth"; // <-- nuevo
import RequireProfile from "./lib/RequireProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Historial from "./pages/Historial";
import Settings from "./pages/Settings";

const App = () => (
  <SessionProvider>
    <ThemeProvider>
      <IntakeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registro" element={<RequireAuth><Registro /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireProfile><Dashboard /></RequireProfile>} />
            <Route path="/historial" element={<RequireProfile><Historial /></RequireProfile>} />
            <Route path="/settings" element={<RequireProfile><Settings /></RequireProfile>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </IntakeProvider>
    </ThemeProvider>
  </SessionProvider>
);

export default App;

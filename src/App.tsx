// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SessionProvider } from "./context/SessionContext";
import { IntakeProvider } from "./context/IntakeContext";
import RequireAuth from "./lib/RequireAuth"; // <-- nuevo
import Login from "./pages/Login";
import Register from "./pages/Register";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Historial from "./pages/Historial";
import Settings from "./pages/Settings";

const App = () => (
  <ThemeProvider>
    <SessionProvider>
      <IntakeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/registro" element={<RequireAuth><Registro /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/historial" element={<RequireAuth><Historial /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </IntakeProvider>
    </SessionProvider>
  </ThemeProvider>
);

export default App;

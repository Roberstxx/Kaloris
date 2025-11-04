// src/lib/RequireAuth.tsx
import { Navigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// src/lib/RequireProfile.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/context/SessionContext";

export default function RequireProfile({ children }: { children: JSX.Element }) {
  const { isAuthenticated, needsProfile } = useSession();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (needsProfile) {
    return <Navigate to="/registro" replace state={{ from: location }} />;
  }

  return children;
}

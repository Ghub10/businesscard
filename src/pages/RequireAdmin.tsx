import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminPassword } from "../hooks/useAdminSession";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const password = useAdminPassword();
  const location = useLocation();

  if (!password) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }

  return children;
}

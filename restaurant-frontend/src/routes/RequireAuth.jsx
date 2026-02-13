import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireAuth({ allowedRoles }) {
  const { token, role } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Dashboard from "./Dashboard";

/**
 * Smart Home component that redirects users to their role-specific landing page.
 * This prevents unauthorized users (like Waiters) from hitting the Dashboard
 * and being met with a "Forbidden" error.
 */
export default function Home() {
  const { role } = useAuth();

  // 1. High-level Management & Head Chef -> Dashboard
  if (role === "Admin" || role === "Manager" || role === "Head Chef") {
    return <Dashboard />;
  }

  // 2. Waiters -> Point of Sale (Primary workspace)
  if (role === "Waiter") {
    return <Navigate to="/pos" replace />;
  }

  // 3. Standard Chefs -> Recipes / Prep List
  if (role === "Chef") {
    return <Navigate to="/recipes" replace />;
  }

  // 4. General Staff -> Roster / Profile
  if (role === "Staff") {
    return <Navigate to="/roster" replace />;
  }

  // Fallback -> Profile
  return <Navigate to="/profile" replace />;
}

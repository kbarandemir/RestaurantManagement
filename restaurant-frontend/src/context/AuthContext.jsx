import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api/client";
import { getRoleFromToken } from "../utils/jwt";

/**
 * AuthContext — Global authentication state manager for the React application.
 *
 * Manages the full authentication lifecycle:
 *   1. Login: POST /api/auth/login → receives JWT or first-login flag
 *   2. First-Login: User created by admin must change temp password before accessing the app
 *   3. Password Change: POST /api/auth/change-password → receives real JWT
 *   4. Logout: Clears localStorage and all auth state
 *
 * The JWT token is stored in localStorage and decoded client-side to extract
 * the user's role (Admin/Manager/Chef/Waiter/Staff) for RBAC route guards.
 *
 * State exposed via useAuth() hook:
 *   - token: JWT access token string
 *   - role: decoded role from the JWT (e.g., "Admin", "Manager")
 *   - user: user profile object from the login response
 *   - requiresPasswordChange: true if first-login flow is active
 *   - login(), logout(), completePasswordChange(): action functions
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));
  const [role, setRole] = useState(() => (token ? getRoleFromToken(token) : null));
  const [user, setUser] = useState(null);

  // First-login state — user hasn't gotten a real token yet
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [pendingActivationCode, setPendingActivationCode] = useState(null);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const data = res.data;

    if (data.requiresPasswordChange) {
      // Stash first-login info; do NOT issue a real token
      setRequiresPasswordChange(true);
      setPendingEmail(data.email);
      setPendingActivationCode(data.activationCode);
      return { requiresPasswordChange: true };
    }

    // Normal login
    const accessToken = data.auth.accessToken;
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
    setRole(getRoleFromToken(accessToken));
    setUser(data.auth.user ?? null);
    return { requiresPasswordChange: false };
  };

  // Called after successful /api/auth/change-password
  const completePasswordChange = (authResponse) => {
    const accessToken = authResponse.accessToken;
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
    setRole(getRoleFromToken(accessToken));
    setUser(authResponse.user ?? null);

    // Clear first-login state
    setRequiresPasswordChange(false);
    setPendingEmail(null);
    setPendingActivationCode(null);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setRole(null);
    setUser(null);
    setRequiresPasswordChange(false);
    setPendingEmail(null);
    setPendingActivationCode(null);
  };

  const value = useMemo(
    () => ({
      token,
      role,
      user,
      requiresPasswordChange,
      pendingEmail,
      pendingActivationCode,
      login,
      logout,
      completePasswordChange,
    }),
    [token, role, user, requiresPasswordChange, pendingEmail, pendingActivationCode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

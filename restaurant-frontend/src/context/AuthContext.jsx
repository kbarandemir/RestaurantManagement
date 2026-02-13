import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api/client";
import { getRoleFromToken } from "../utils/jwt";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));
  const [role, setRole] = useState(() => (token ? getRoleFromToken(token) : null));
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    // Backend endpoint: POST /api/auth/login
    // Expected response: { accessToken: "...", user: { ... } }
    const res = await api.post("/api/auth/login", { email, password });

    const accessToken = res.data.accessToken;
    localStorage.setItem("accessToken", accessToken);

    setToken(accessToken);
    setRole(getRoleFromToken(accessToken));
    setUser(res.data.user ?? null);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setRole(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, role, user, login, logout }), [token, role, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("sigera_access"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return;
    refreshUser().catch(() => logout());
  }, [token]);

  async function refreshUser() {
    const res = await api.get("/auth/me/");
    setUser(res.data);
    return res.data;
  }

  async function login(username, password) {
    const res = await api.post("/auth/token/", { username, password });
    localStorage.setItem("sigera_access", res.data.access);
    localStorage.setItem("sigera_refresh", res.data.refresh);
    setToken(res.data.access);
    const userResponse = await api.get("/auth/me/");
    setUser(userResponse.data);
    return userResponse.data;
  }

  function logout() {
    localStorage.removeItem("sigera_access");
    localStorage.removeItem("sigera_refresh");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, login, logout, refreshUser }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

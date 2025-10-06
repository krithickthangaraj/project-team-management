import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const getStored = (key) => {
    try {
      const local = localStorage.getItem(key);
      if (local) return local;
      const session = sessionStorage.getItem(key);
      return session || null;
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(() => {
    try {
      const raw = getStored("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = ({ user, access_token, remember = true }) => {
    const storage = remember ? localStorage : sessionStorage;
    if (access_token) storage.setItem("access_token", access_token);
    if (user) {
      storage.setItem("user", JSON.stringify(user));
      setUser(user);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");
    } catch {}
    setUser(null);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    try {
      const token = getStored("access_token");
      if (token && !user) {
        const stored = getStored("user");
        if (stored) setUser(JSON.parse(stored));
      }
    } catch {
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser: login, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

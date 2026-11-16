import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import type { AuthUser, UserRole } from "../api/types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (name: string, email: string, password: string, confirmPassword?: string, isWomanConfirm?: boolean) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isListener: boolean;
  isTrainer: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("restarther_token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("restarther_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem("restarther_token");
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem("restarther_user", JSON.stringify(data.user));
        // Keep session user id in sync for backward compatibility
        localStorage.setItem("restarther.userId", String(data.user.id));
      }
    } catch {
      // Invalid or expired token
      localStorage.removeItem("restarther_token");
      localStorage.removeItem("restarther_user");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    const res = await api.login({ email, password });
    localStorage.setItem("restarther_token", res.access_token);
    localStorage.setItem("restarther_user", JSON.stringify(res.user));
    localStorage.setItem("restarther.userId", String(res.user.id));
    setToken(res.access_token);
    setUser(res.user);
    return res.redirect;
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string, isWomanConfirm?: boolean): Promise<string> => {
    const res = await api.register({
      name,
      email,
      password,
      confirm_password: confirmPassword,
      terms_accepted: true,
      is_woman_confirm: isWomanConfirm !== false,
    });
    localStorage.setItem("restarther_token", res.access_token);
    localStorage.setItem("restarther_user", JSON.stringify(res.user));
    localStorage.setItem("restarther.userId", String(res.user.id));
    setToken(res.access_token);
    setUser(res.user);
    return res.redirect;
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem("restarther_token");
    localStorage.removeItem("restarther_user");
    localStorage.removeItem("restarther.userId");
    setToken(null);
    setUser(null);
  };

  const isListener = user?.role === "listener";
  const isTrainer = user?.role === "trainer";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isListener,
        isTrainer,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

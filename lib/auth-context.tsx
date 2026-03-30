"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser, UserRole } from "./types";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isResponsible: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  isResponsible: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("./auth").then(({ getMe }) => {
      getMe()
        .then((u) => setUser(u))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    });
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isResponsible = user?.role === "RESPONSIBLE";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isResponsible }}>
      {children}
    </AuthContext.Provider>
  );
}

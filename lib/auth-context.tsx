"use client";

import { createContext, useContext, useEffect, useState } from "react";

type UserRole = "admin" | "professor" | "aluno";
type LoginPortal = "admin" | "professor" | "aluno";

type User = {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  statusAluno?: string | null;
  bloqueioFinanceiroAtivo?: boolean;
  isMasterAdmin?: boolean;
};

type LoginResult = {
  ok: boolean;
  role?: UserRole;
  error?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    senha: string,
    portal?: LoginPortal
  ) => Promise<LoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeRole(role: string): UserRole | null {
  const value = String(role).toUpperCase();

  if (value === "ADMIN") return "admin";
  if (value === "PROFESSOR") return "professor";
  if (value === "ALUNO") return "aluno";

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          const role = normalizeRole(data?.user?.role);

          if (!role) {
            setUser(null);
          } else {
            setUser({
              ...data.user,
              role,
            });
          }
        }
      } catch {
        setUser(null);
      }

      setLoading(false);
    }

    fetchUser();
  }, []);

  async function login(
    email: string,
    senha: string,
    portal: LoginPortal = "admin"
  ): Promise<LoginResult> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha, portal }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          ok: false,
          error: data?.error || "Email ou senha inválidos",
        };
      }

      const role = normalizeRole(data?.user?.role);

      if (!role) {
        return {
          ok: false,
          error: "Perfil de usuário inválido",
        };
      }

      setUser({
        ...data.user,
        role,
      });

      return {
        ok: true,
        role,
      };
    } catch (error) {
      console.error("ERRO AUTH CONTEXT LOGIN:", error);
      return {
        ok: false,
        error: "Erro ao conectar com o servidor",
      };
    }
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve estar dentro do AuthProvider");
  }

  return context;
}
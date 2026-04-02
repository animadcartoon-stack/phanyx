"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  nome: string;
  email: string;
  role: "admin" | "professor" | "aluno";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔥 RESTAURA USUÁRIO PELO COOKIE
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        setUser(null);
      }

      setLoading(false);
    }

    fetchUser();
  }, []);

  async function login(email: string, senha: string) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setUser(data.user);

    if (data.user.role === "admin") {
      router.push("/admin");
    } else if (data.user.role === "professor") {
      router.push("/professor");
    } else {
      router.push("/aluno");
    }

    return true;
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    router.push("/login");
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
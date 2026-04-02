"use client";

import { useRouter } from "next/navigation";

export type Perfil = "admin" | "professor" | "aluno";

export function useAuth() {
  const router = useRouter();

  function login(nome: string, perfil: Perfil) {
    localStorage.setItem(
      "usuario-logado",
      JSON.stringify({ nome, perfil })
    );

    if (perfil === "admin") router.push("/admin");
    if (perfil === "professor") router.push("/professor");
    if (perfil === "aluno") router.push("/aluno");
  }

  function logout() {
    localStorage.removeItem("usuario-logado");
    router.push("/login");
  }

  function getUsuario() {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("usuario-logado");
    return data ? JSON.parse(data) : null;
  }

  return { login, logout, getUsuario };
}

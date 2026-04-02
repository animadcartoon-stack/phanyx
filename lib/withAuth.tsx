"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function withAuth(
  Component: any,
  allowedRoles?: ("admin" | "professor" | "aluno")[]
) {
  return function ProtectedPage(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.replace("/login");
          return;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.replace("/login");
          return;
        }

        const alunoBloqueado =
          user.role === "aluno" &&
          user.bloqueioFinanceiroAtivo &&
          user.statusAluno === "INADIMPLENTE";

        if (
          alunoBloqueado &&
          pathname !== "/aluno/bloqueado-financeiro"
        ) {
          router.replace("/aluno/bloqueado-financeiro");
          return;
        }

        if (
          pathname === "/aluno/bloqueado-financeiro" &&
          !alunoBloqueado &&
          user.role === "aluno"
        ) {
          router.replace("/aluno");
        }
      }
    }, [user, loading, router, pathname]);

    if (loading) return <p>Carregando...</p>;
    if (!user) return null;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return null;
    }

    const alunoBloqueado =
      user.role === "aluno" &&
      user.bloqueioFinanceiroAtivo &&
      user.statusAluno === "INADIMPLENTE";

    if (
      alunoBloqueado &&
      pathname !== "/aluno/bloqueado-financeiro"
    ) {
      return null;
    }

    return <Component {...props} />;
  };
}
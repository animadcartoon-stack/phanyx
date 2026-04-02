"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AllowedRole = "admin" | "aluno" | "professor";

function getLoginPath(role: AllowedRole) {
  return `/login?portal=${role}`;
}

export default function withAuth(
  Component: React.ComponentType<any>,
  allowedRoles: AllowedRole[]
) {
  return function ProtectedComponent(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      const portalPrincipal = allowedRoles[0] || "admin";

      if (loading) {
        return;
      }

      if (!user) {
        router.replace(getLoginPath(portalPrincipal));
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        router.replace(getLoginPath(portalPrincipal));
      }
    }, [user, loading, router, allowedRoles]);

    if (loading) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Carregando...
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (!allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}
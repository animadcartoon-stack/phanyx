import type { UsuarioLogado } from "@/lib/server-auth";

export const MASTER_SUPORTE_EMAIL =
  "academicophanyx@gmail.com";

export function normalizarRoleImpersonacao(
  role?: string | null
) {
  return String(role || "")
    .trim()
    .toUpperCase();
}

export function masterPodeImpersonar(
  usuario: UsuarioLogado | null
) {
  if (!usuario) return false;

  return (
    usuario.isMasterAdmin === true &&
    usuario.impersonacao !== true &&
    usuario.email.trim().toLowerCase() ===
      MASTER_SUPORTE_EMAIL
  );
}

export function portalDestinoPorRole(
  role?: string | null
): {
  portal: "admin" | "professor" | "aluno";
  destino: string;
} | null {
  const roleNormalizada =
    normalizarRoleImpersonacao(role);

  if (roleNormalizada === "ALUNO") {
    return {
      portal: "aluno",
      destino: "/aluno",
    };
  }

  if (roleNormalizada === "PROFESSOR") {
    return {
      portal: "professor",
      destino: "/professor",
    };
  }

  if (
    [
      "ADMIN",
      "FUNCIONARIO",
      "SECRETARIA",
      "FINANCEIRO",
      "COORDENADOR",
      "SUPORTE",
      "GERENCIA",
    ].includes(roleNormalizada)
  ) {
    return {
      portal: "admin",
      destino: "/admin",
    };
  }

  return null;
}
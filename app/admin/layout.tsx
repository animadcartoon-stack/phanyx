import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";
import ImpersonacaoBanner from "@/components/suporte/ImpersonacaoBanner";
import { getUserFromToken } from "@/lib/server-auth";
import { obterContextoGestaoPolos } from "@/lib/polos-rede";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * O layout valida a sessão no servidor e já entrega usuário e permissões
   * ao AdminShell. Assim, os menus não precisam nascer ocultos enquanto o
   * navegador realiza várias chamadas consecutivas.
   */
  const usuario = await getUserFromToken();

  if (!usuario) {
    redirect("/login?portal=admin");
  }

  const role = String(usuario.role || "").toUpperCase();

  const podeEntrarNoPortalAdmin = [
    "ADMIN",
    "SUPER_ADMIN",
    "FUNCIONARIO",
    "SECRETARIA",
    "FINANCEIRO",
    "COORDENADOR",
    "SUPORTE",
    "GERENCIA",
  ].includes(role);

  if (!podeEntrarNoPortalAdmin) {
    redirect("/login?portal=admin");
  }

  const contextoPolos = usuario.instituicaoId
    ? await obterContextoGestaoPolos(
        usuario.instituicaoId
      ).catch(() => null)
    : null;

  const usuarioInicial = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    instituicaoId: usuario.instituicaoId,
    isMasterAdmin: usuario.isMasterAdmin,
    instituicaoContratanteId:
      contextoPolos?.instituicaoContratanteId ?? null,
    ehInstituicaoContratante:
      contextoPolos?.ehInstituicaoContratante ?? false,
    permissaoDelegadaPolos:
      contextoPolos?.permissaoDelegada ?? false,
    podeGerenciarPolos:
      contextoPolos?.podeGerenciarPolos ?? false,
  };

  return (
    <>
      <ImpersonacaoBanner />

      <AdminShell
        usuarioInicial={usuarioInicial}
        permissoesIniciais={usuario.permissoes}
      >
        {children}
      </AdminShell>
    </>
  );
}

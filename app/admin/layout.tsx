import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";
import ImpersonacaoBanner from "@/components/suporte/ImpersonacaoBanner";
import { getUserFromToken } from "@/lib/server-auth";
import { obterContextoGestaoPolos } from "@/lib/polos-rede";
import { cookies } from "next/headers";
import { identificarSessaoAdmin } from "@/lib/sessao-inatividade-admin";

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
  const tokenSessao = (await cookies()).get("token")?.value;
  const referenciaSessaoInicial = identificarSessaoAdmin(tokenSessao, process.env.JWT_SECRET)?.referencia ?? null;

  return (
    <>
      <ImpersonacaoBanner />

      <AdminShell
        usuarioInicial={usuarioInicial}
        permissoesIniciais={usuario.permissoes}
        referenciaSessaoInicial={referenciaSessaoInicial}
      >
        {children}
      </AdminShell>
    </>
  );
}

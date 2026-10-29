import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { ErroConversaoAvulsa, prepararConversaoAvulsa } from "@/lib/academico/converter-cadastro-avulso";
import { ErroCadastroTurmaAvulsa } from "@/lib/academico/validar-turma-avulsa";
export const dynamic = "force-dynamic";
const json = (dados: unknown, status = 200) => NextResponse.json(dados, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) return json({ codigo: "SEM_PERMISSAO", error: "Não autenticado." }, 401);
    if (!isAdminLike(user.role) || !Number.isSafeInteger(user.instituicaoId) || user.instituicaoId <= 0) return json({ codigo: "SEM_PERMISSAO", error: "Sem permissão." }, 403);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) || (body.confirmar !== false && body.confirmar !== true)) return json({ codigo: "DADOS_INVALIDOS", error: "Solicite uma prévia antes de confirmar." }, 400);
    return await prisma.$transaction(async tx => {
      const plano = await prepararConversaoAvulsa(tx, user.instituicaoId, body);
      if (!body.confirmar) return json({ previa: plano.previa });
      if (typeof body.chave !== "string" || body.chave !== plano.previa.chave) throw new ErroConversaoAvulsa("DADOS_ALTERADOS", "O cadastro mudou. Revise uma nova prévia antes de confirmar.");
      return json({ cadastro: await plano.aplicar(), previa: plano.previa });
    }, { isolationLevel: "Serializable", timeout: 20000 });
  } catch (erro) {
    if (erro instanceof ErroConversaoAvulsa) return json({ codigo: erro.codigo, error: erro.message }, erro.status);
    if (erro instanceof ErroCadastroTurmaAvulsa) return json({ codigo: erro.codigo, error: erro.message }, 400);
    const codigo = (erro as { code?: string })?.code;
    if (["P2034", "P2002", "P2003", "P2014", "P2025"].includes(codigo || "")) return json({ codigo: "DADOS_ALTERADOS", error: "Há vínculos ou alterações simultâneas. Nenhuma conversão foi concluída; revise o cadastro." }, 409);
    console.error("Falha na conversão de cadastro avulso:", erro);
    return json({ codigo: "FALHA_CONVERSAO", error: "Não foi possível converter o cadastro." }, 500);
  }
}

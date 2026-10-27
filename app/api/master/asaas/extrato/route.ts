import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { consultarExtratoAsaas, ErroExtratoAsaas } from "@/lib/master/asaas-extrato";
import { periodoExtrato } from "@/lib/master/asaas-extrato-model";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };
const resposta = (dados: unknown, status = 200) => NextResponse.json(dados, { status, headers });

export async function GET(req: Request) {
  try {
    const sessao = await getUserFromToken();
    if (!sessao) return resposta({ error: "Não autenticado." }, 401);
    const usuario = await prisma.user.findUnique({ where: { id: sessao.id }, select: { isMasterAdmin: true, ativo: true } });
    if (!usuario?.isMasterAdmin || !usuario.ativo) return resposta({ error: "Sem permissão para consultar a conta Asaas principal." }, 403);
    const parametros = new URL(req.url).searchParams;
    let periodo: ReturnType<typeof periodoExtrato>;
    try { periodo = periodoExtrato(parametros.get("inicio"), parametros.get("fim")); }
    catch (e) { return resposta({ error: (e as Error).message, codigo: "PERIODO_INVALIDO" }, 400); }
    return resposta(await consultarExtratoAsaas(periodo));
  } catch (e) {
    if (e instanceof ErroExtratoAsaas) return resposta({ error: e.message, codigo: e.codigo }, e.status);
    // Não inclui resposta bruta do provedor, credenciais ou dados financeiros nos logs.
    return resposta({ error: "Não foi possível concluir a consulta ao Asaas. Atualize para tentar novamente.", codigo: "CONSULTA_FALHOU" }, 502);
  }
}

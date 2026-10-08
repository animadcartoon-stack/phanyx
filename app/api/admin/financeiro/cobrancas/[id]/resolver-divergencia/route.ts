import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, temAlgumaPermissao } from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { analisarDivergencia, calcularSaldoParcela, objetoJson } from "@/lib/financeiro/divergencias";

export const dynamic = "force-dynamic";
type Contexto = { params: Promise<{ id: string }> };
class ErroConferencia extends Error {
  constructor(public codigo: string, public status = 409) { super(codigo); }
}

async function autenticar() {
  const usuario = await getUserFromToken();
  if (!usuario?.instituicaoId) throw new ErroConferencia("NAO_AUTORIZADO", 401);
  if (!usuario.isMasterAdmin
    && !["ADMIN", "GERENCIA", "SUPER_ADMIN", "FINANCEIRO", "SECRETARIA"].includes(usuario.role)
    && !temAlgumaPermissao(usuario, ["financeiro.recebimentos", "caixa.receber"])) {
    throw new ErroConferencia("SEM_PERMISSAO", 403);
  }
  if (!planoTemRecurso(usuario.plano || "ESSENCIAL", "FINANCEIRO")) {
    throw new ErroConferencia("PLANO_SEM_FINANCEIRO", 403);
  }
  return usuario;
}

function inteiro(valor: unknown) {
  const numero = typeof valor === "string" || typeof valor === "number" ? Number(valor) : NaN;
  if (!Number.isSafeInteger(numero) || numero <= 0) throw new ErroConferencia("REQUISICAO_INVALIDA", 400);
  return numero;
}

const incluirParcela = {
  pagamentos: { select: { valorPago: true } },
  matricula: { select: { realizadaPeloAluno: true, status: true, numeroMatricula: true } },
} satisfies Prisma.LancamentoFinanceiroInclude;

async function conferir(tx: Prisma.TransactionClient, cobrancaId: number, instituicaoId: number, destinoId?: number) {
  const cobranca = await tx.cobrancaFinanceira.findFirst({
    where: { id: cobrancaId, instituicaoId },
    include: {
      aluno: { select: { id: true, nome: true } },
      contaFinanceira: { select: { nome: true, moeda: true } },
      lancamentoFinanceiro: { include: incluirParcela },
    },
  });
  if (!cobranca) throw new ErroConferencia("COBRANCA_NAO_ENCONTRADA", 404);
  const destino = destinoId && destinoId !== cobranca.lancamentoFinanceiroId
    ? await tx.lancamentoFinanceiro.findFirst({
      where: { id: destinoId, instituicaoId, alunoId: cobranca.alunoId },
      include: incluirParcela,
    }) : cobranca.lancamentoFinanceiro;
  if (!destino) throw new ErroConferencia("PARCELA_NAO_ENCONTRADA", 404);
  const configuracao = await tx.configuracaoFinanceiraInstituicao.findUnique({
    where: { instituicaoId }, select: { permitirPagamentoParcial: true },
  });
  const analise = analisarDivergencia({
    ...cobranca, lancamentoFinanceiroId: destino.id, matriculaId: destino.matriculaId,
  }, destino, configuracao?.permitirPagamentoParcial ?? true);
  if (destino.id !== cobranca.lancamentoFinanceiroId) {
    const outra = await tx.cobrancaFinanceira.findFirst({
      where: {
        instituicaoId, lancamentoFinanceiroId: destino.id, id: { not: cobrancaId },
        statusOperacional: { not: "CANCELADO" },
        statusBancario: { notIn: ["CANCELADO", "ESTORNADO", "FALHA"] },
      }, select: { id: true },
    });
    if (outra) { analise.bloqueios.push("PARCELA_COM_OUTRA_COBRANCA"); analise.motivos.push("PARCELA_COM_OUTRA_COBRANCA"); analise.podeResolver = false; }
  }
  return { cobranca, destino, analise };
}

function tratarErro(erro: unknown) {
  if (erro instanceof ErroConferencia) {
    return NextResponse.json({ error: erro.codigo, codigo: erro.codigo }, { status: erro.status });
  }
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034") {
    return NextResponse.json({ error: "CONFERENCIA_DESATUALIZADA", codigo: "CONFERENCIA_DESATUALIZADA" }, { status: 409 });
  }
  console.error("Erro ao resolver divergência financeira:", erro);
  return NextResponse.json({ error: "ERRO_CONFERENCIA", codigo: "ERRO_CONFERENCIA" }, { status: 500 });
}

export async function GET(req: NextRequest, context: Contexto) {
  try {
    const usuario = await autenticar();
    const id = inteiro((await context.params).id);
    const params = new URL(req.url).searchParams;
    const destinoId = params.has("lancamentoFinanceiroId") ? inteiro(params.get("lancamentoFinanceiroId")) : undefined;
    const busca = String(params.get("busca") || "").trim().slice(0, 150);
    const instituicaoId = Number(usuario.instituicaoId);
    const dados = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { cobranca, destino, analise } = await conferir(tx, id, instituicaoId, destinoId);
      const candidatas = await tx.lancamentoFinanceiro.findMany({
        where: {
          instituicaoId, alunoId: cobranca.alunoId, tipo: "MENSALIDADE",
          status: { in: ["PENDENTE", "PARCIAL", "ATRASADO"] },
          AND: [{ OR: [{ matriculaId: null }, { matricula: { is: { realizadaPeloAluno: false, status: { not: "CANCELADA" } } } }] }],
          ...(busca ? { descricao: { contains: busca, mode: "insensitive" as const } } : {}),
        }, include: incluirParcela, orderBy: [{ vencimento: "asc" }, { id: "asc" }], take: 100,
      });
      const motivosRegistrados = objetoJson(objetoJson(cobranca.metadata).divergencia).motivos;
      return {
        cobranca: {
          id: cobranca.id, referenciaInterna: cobranca.referenciaInterna,
          statusBancario: cobranca.statusBancario, statusOperacional: cobranca.statusOperacional,
          versao: cobranca.updatedAt.toISOString(), aluno: cobranca.aluno, conta: cobranca.contaFinanceira,
          parcelaOriginalId: cobranca.lancamentoFinanceiroId,
        },
        parcela: { id: destino.id, descricao: destino.descricao, vencimento: destino.vencimento, versao: destino.updatedAt.toISOString() },
        analise,
        motivosDetectados: Array.from(new Set([
          ...(Array.isArray(motivosRegistrados) ? motivosRegistrados.filter((item): item is string => typeof item === "string") : []),
          ...analisarDivergencia(cobranca, cobranca.lancamentoFinanceiro).motivos,
        ])),
        parcelas: candidatas.map((item) => ({
          id: item.id, descricao: item.descricao, vencimento: item.vencimento,
          matricula: item.matricula?.numeroMatricula, saldoAtual: calcularSaldoParcela(item).saldoAtual,
        })).filter((item) => item.saldoAtual > 0),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return NextResponse.json(dados);
  } catch (erro) { return tratarErro(erro); }
}

export async function POST(req: NextRequest, context: Contexto) {
  try {
    const usuario = await autenticar();
    const cobrancaId = inteiro((await context.params).id);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ErroConferencia("REQUISICAO_INVALIDA", 400);
    const destinoId = inteiro(body.lancamentoFinanceiroId);
    const justificativa = typeof body.justificativa === "string" ? body.justificativa.trim() : "";
    if (justificativa.length < 10 || justificativa.length > 2000) throw new ErroConferencia("JUSTIFICATIVA_INVALIDA", 400);
    if (typeof body.versaoCobranca !== "string" || typeof body.versaoLancamento !== "string") throw new ErroConferencia("REQUISICAO_INVALIDA", 400);
    const instituicaoId = Number(usuario.instituicaoId);
    const resolucao = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const { cobranca, destino, analise } = await conferir(tx, cobrancaId, instituicaoId, destinoId);
      if (cobranca.statusOperacional !== "DIVERGENCIA") throw new ErroConferencia("COBRANCA_ESTADO_ALTERADO");
      if (cobranca.updatedAt.toISOString() !== body.versaoCobranca || destino.updatedAt.toISOString() !== body.versaoLancamento) throw new ErroConferencia("CONFERENCIA_DESATUALIZADA");
      if (!analise.podeResolver) throw new ErroConferencia(analise.bloqueios[0]);
      if (analise.parcial && body.confirmarPagamentoParcial !== true) throw new ErroConferencia("CONFIRMAR_PAGAMENTO_PARCIAL", 400);
      const registro = {
        estado: "RESOLVIDA", tipo: analise.parcial ? "PARCIAL" : "INTEGRAL", instituicaoId,
        alunoId: cobranca.alunoId, lancamentoFinanceiroId: destino.id, matriculaId: destino.matriculaId,
        valorCobrado: analise.valorCobrado, valorCompensado: analise.valorCompensado,
        valorFinal: analise.valorFinal, totalPagoAnterior: analise.totalPagoAnterior, saldoAtual: analise.saldoAtual,
        saldoAposBaixa: analise.saldoAposBaixa, confirmarPagamentoParcial: analise.parcial,
        versaoLancamento: destino.updatedAt.toISOString(), versaoCobrancaAnterior: cobranca.updatedAt.toISOString(),
        resolvidoEm: new Date().toISOString(), resolvidoPorUsuarioId: usuario.id,
        resolvidoPorNome: usuario.nome || usuario.email, justificativa,
        anterior: { lancamentoFinanceiroId: cobranca.lancamentoFinanceiroId, matriculaId: cobranca.matriculaId, statusOperacional: cobranca.statusOperacional, divergencia: objetoJson(objetoJson(cobranca.metadata).divergencia) },
      };
      const reserva = await tx.cobrancaFinanceira.updateMany({
        where: { id: cobrancaId, instituicaoId, updatedAt: cobranca.updatedAt, statusBancario: "COMPENSADO", statusOperacional: "DIVERGENCIA", baixadoEm: null, movimentoCaixaId: null },
        data: { lancamentoFinanceiroId: destino.id, matriculaId: destino.matriculaId, statusOperacional: "AGUARDANDO_BAIXA", metadata: { ...objetoJson(cobranca.metadata), resolucaoDivergencia: registro } as Prisma.InputJsonValue },
      });
      if (reserva.count !== 1) throw new ErroConferencia("CONFERENCIA_DESATUALIZADA");
      await tx.historicoCobranca.create({
        data: {
          instituicaoId, alunoId: cobranca.alunoId, alunoNome: cobranca.aluno.nome,
          lancamentoFinanceiroId: destino.id, responsavelId: usuario.id, responsavelNome: usuario.nome || usuario.email,
          canal: "SISTEMA", acao: "RESOLVER_DIVERGENCIA_BOLETO_COMPENSADO", observacao: justificativa,
          metadata: {
            ...registro, cobrancaFinanceiraId: cobrancaId, statusNovo: "AGUARDANDO_BAIXA",
            ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip"),
            userAgent: req.headers.get("user-agent"), impersonacao: usuario.impersonacao,
            impersonacaoId: usuario.impersonacaoId, masterOriginalId: usuario.masterOriginalId,
          } as Prisma.InputJsonValue,
        },
      });
      return registro;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 30000 });
    return NextResponse.json({ resolucao, statusOperacional: "AGUARDANDO_BAIXA" });
  } catch (erro) { return tratarErro(erro); }
}

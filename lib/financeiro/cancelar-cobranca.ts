import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obterProvedorFinanceiro } from "@/lib/financeiro/provedores";
import { objetoJson } from "@/lib/financeiro/divergencias";
import { estadoCancelamentoBancario } from "@/lib/financeiro/cancelamento-bancario-estado";

type Operador = { id: number | null; nome: string; ip?: string | null; userAgent?: string | null };
function recebido(c: { statusBancario: string; statusOperacional: string; valorCompensado: unknown; baixadoEm: unknown; movimentoCaixaId: unknown;
  lancamentoFinanceiro: { valorPago: number | null; pagamentos: Array<{ valorPago: number }> } }) {
  return c.statusBancario === "COMPENSADO" || c.statusOperacional === "BAIXADO" ||
    Number(c.valorCompensado || 0) > 0 || Boolean(c.baixadoEm || c.movimentoCaixaId) ||
    Number(c.lancamentoFinanceiro.valorPago || 0) > 0 || c.lancamentoFinanceiro.pagamentos.some(p => p.valorPago > 0);
}
async function buscar(tx: Prisma.TransactionClient, id: number, instituicaoId: number) {
  return tx.cobrancaFinanceira.findFirst({ where: { id, instituicaoId },
    include: { contaFinanceira: true, lancamentoFinanceiro: { include: { pagamentos: true } } } });
}
async function travar(tx: Prisma.TransactionClient, id: number, instituicaoId: number) {
  await tx.$queryRaw`SELECT "id" FROM "CobrancaFinanceira" WHERE "id" = ${id} AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
}

/** Intenção persistida antes da API; falha mantém o cancelamento visível para retentativa. */
export async function cancelarCobrancaFinanceira(params: {
  id: number; instituicaoId: number; motivo: string; operador: Operador;
}) {
  const { id, instituicaoId, motivo, operador } = params;
  const token = randomUUID();
  const reserva = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await travar(tx, id, instituicaoId);
    const c = await buscar(tx, id, instituicaoId);
    if (!c) throw new Error("COBRANCA_NAO_ENCONTRADA");
    if (recebido(c)) throw new Error("PAGAMENTO_NAO_CANCELAVEL");
    const anterior = estadoCancelamentoBancario(c.metadata);
    if (c.statusBancario === "CANCELADO" && c.statusOperacional === "CANCELADO" &&
        c.lancamentoFinanceiro.status === "CANCELADO") return { cobranca: c, pronta: true };
    if (anterior.estado === "PROCESSANDO" && Date.now() - Date.parse(String(anterior.tentativaEm)) < 120000) {
      return { cobranca: c, ocupada: true };
    }
    await tx.cobrancaFinanceira.update({ where: { id }, data: {
      metadata: { ...objetoJson(c.metadata), cancelamentoBancario: {
        ...anterior, estado: "PROCESSANDO", token, motivo, operador,
        tentativaEm: new Date().toISOString(), tentativas: Number(anterior.tentativas || 0) + 1,
      } } as Prisma.InputJsonValue,
    } });
    return { cobranca: c };
  });
  if (reserva.pronta) return { cancelado: true, pendente: false, id };
  if (reserva.ocupada) return { cancelado: false, pendente: true, id };
  const c = reserva.cobranca;
  try {
    if (c.statusBancario !== "CANCELADO") {
      // Nunca concluir localmente enquanto uma emissão externa pode estar em andamento.
      if (c.statusBancario === "EM_PROCESSAMENTO") throw new Error("EMISSAO_EM_ANDAMENTO");
      const provedor = obterProvedorFinanceiro(c.contaFinanceira);
      let externoId = c.cobrancaExternaId;
      if (!externoId) {
        const achado = await provedor.buscarBoletoPorReferencia(c.referenciaExterna || `PHANYX_COBRANCA:${instituicaoId}:${c.lancamentoFinanceiroId}`);
        externoId = achado?.cobrancaExternaId || null;
      }
      if (externoId) {
        await provedor.cancelarBoleto({ cobrancaExternaId: externoId,
          clienteExternoId: c.clienteExternoId || "", referenciaExterna: c.referenciaExterna || "",
          valorCobrado: Number(c.valorCobrado) });
      }
    }
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await travar(tx, id, instituicaoId);
      const atual = await buscar(tx, id, instituicaoId);
      if (!atual) throw new Error("COBRANCA_NAO_ENCONTRADA");
      if (recebido(atual)) throw new Error("PAGAMENTO_NAO_CANCELAVEL");
      const estado = estadoCancelamentoBancario(atual.metadata);
      if (estado.token !== token) throw new Error("CANCELAMENTO_ALTERADO");
      await tx.cobrancaFinanceira.update({ where: { id }, data: {
        statusBancario: "CANCELADO", statusOperacional: "CANCELADO", erroIntegracao: null,
        metadata: { ...objetoJson(atual.metadata), cancelamentoBancario: { ...estado,
          estado: "CONFIRMADO", confirmadoEm: new Date().toISOString(), erro: null } } as Prisma.InputJsonValue,
      } });
      // Não apaga valores, observações ou pagamentos já registrados.
      await tx.lancamentoFinanceiro.updateMany({
        where: { id: atual.lancamentoFinanceiroId, instituicaoId, status: { in: ["PENDENTE", "ATRASADO", "PARCIAL"] },
          OR: [{ valorPago: 0 }, { valorPago: null }], pagamentos: { none: { valorPago: { gt: 0 } } } },
        data: { status: "CANCELADO" },
      });
    });
    return { cancelado: true, pendente: false, id };
  } catch (erro) {
    const codigo = erro instanceof Error ? erro.message : "FALHA_CANCELAMENTO_BANCARIO";
    // A resposta do banco nunca é substituída por sucesso local. GET/DELETE podem ser repetidos com segurança.
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await travar(tx, id, instituicaoId);
      const atual = await buscar(tx, id, instituicaoId);
      if (!atual) return;
      const estado = estadoCancelamentoBancario(atual.metadata);
      if (estado.token !== token) return;
      const revisao = ["PAGAMENTO_NAO_CANCELAVEL", "IDENTIDADE_COBRANCA_INCOMPLETA", "IDENTIDADE_COBRANCA_DIVERGENTE", "ORIGEM_RECORRENTE_REQUER_CANCELAMENTO_PROPRIO"].includes(codigo);
      await tx.cobrancaFinanceira.update({ where: { id }, data: {
        erroIntegracao: revisao ? "CANCELAMENTO_BANCARIO_REQUER_REVISAO" : "CANCELAMENTO_BANCARIO_PENDENTE",
        metadata: { ...objetoJson(atual.metadata), cancelamentoBancario: { ...estado,
          estado: revisao ? "REVISAO" : "PENDENTE", erro: codigo.slice(0, 300) } } as Prisma.InputJsonValue,
      } });
    });
    return { cancelado: false, pendente: true, id };
  }
}

/** Recupera também intenções antigas cujo processo terminou antes de chamar o banco. */
export async function processarCancelamentosBancarios(instituicaoId?: number, matriculaId?: number) {
  const itens = await prisma.cobrancaFinanceira.findMany({ where: {
    ...(instituicaoId ? { instituicaoId } : {}),
    ...(matriculaId ? { lancamentoFinanceiro: { matriculaId } } : {}),
    statusBancario: { notIn: ["ESTORNADO", "COMPENSADO"] },
    statusOperacional: { not: "BAIXADO" },
    AND: [{ OR: [
      { metadata: { path: ["cancelamentoBancario", "estado"], equals: "PENDENTE" } },
      { metadata: { path: ["cancelamentoBancario", "estado"], equals: "PROCESSANDO" } },
      { lancamentoFinanceiro: { status: "CANCELADO" }, statusBancario: { not: "CANCELADO" } },
    ] }, { OR: [{ erroIntegracao: null }, { erroIntegracao: { not: "CANCELAMENTO_BANCARIO_REQUER_REVISAO" } }] }],
  }, select: { id: true, instituicaoId: true }, orderBy: { updatedAt: "asc" }, take: 100 });
  let confirmados = 0, pendentes = 0;
  const inicio = Date.now();
  for (const item of itens) {
    if (Date.now() - inicio > 20000) break;
    try {
      const r = await cancelarCobrancaFinanceira({ ...item, motivo: "Cancelamento solicitado no PHANYX",
        operador: { id: null, nome: "Reconciliação automática" } });
      if (r.cancelado) confirmados++; else pendentes++;
    } catch { pendentes++; }
  }
  const restantes = await prisma.cobrancaFinanceira.count({ where: {
    ...(instituicaoId ? { instituicaoId } : {}),
    ...(matriculaId ? { lancamentoFinanceiro: { matriculaId } } : {}),
    statusBancario: { notIn: ["ESTORNADO", "COMPENSADO"] },
    OR: [{ lancamentoFinanceiro: { status: "CANCELADO" }, statusBancario: { not: "CANCELADO" } },
      { metadata: { path: ["cancelamentoBancario", "estado"], equals: "PENDENTE" } },
      { metadata: { path: ["cancelamentoBancario", "estado"], equals: "PROCESSANDO" } },
      { metadata: { path: ["cancelamentoBancario", "estado"], equals: "REVISAO" } }],
  } });
  return { confirmados, pendentes: Math.max(restantes, pendentes) };
}

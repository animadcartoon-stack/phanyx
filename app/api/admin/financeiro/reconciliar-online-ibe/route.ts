import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const IBE_INSTITUICAO_ID = Number(process.env.IBE_INSTITUICAO_ID || 0);
const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
const STATUS_PAGOS = new Set(["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"]);

type PagamentoAsaas = {
  id?: string;
  status?: string;
  value?: number;
  externalReference?: string | null;
};

async function consultarPagamento(id: string): Promise<PagamentoAsaas> {
  const resposta = await fetch(
    `${ASAAS_API_URL}/payments/${encodeURIComponent(id)}`,
    {
      headers: {
        accept: "application/json",
        access_token: process.env.ASAAS_API_KEY!,
        "User-Agent": "PHANYX/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!resposta.ok) {
    throw new Error(`Consulta Asaas falhou (${resposta.status})`);
  }

  return resposta.json();
}

export async function POST() {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !["ADMIN", "FINANCEIRO"].includes(user.role) ||
      !IBE_INSTITUICAO_ID ||
      user.instituicaoId !== IBE_INSTITUICAO_ID
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 403 });
    }

    if (!process.env.ASAAS_API_KEY) {
      return NextResponse.json(
        { error: "ASAAS_API_KEY não configurada." },
        { status: 503 }
      );
    }

    // Somente lançamentos de matrícula online ainda abertos. O vínculo
    // matriculaGeradaId evita associar o pagamento de outro aluno ou curso.
    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where: {
        instituicaoId: IBE_INSTITUICAO_ID,
        tipo: "MATRICULA",
        descricao: { startsWith: "Matrícula online IBE" },
        status: { in: ["PENDENTE", "PARCIAL", "ATRASADO"] },
        matricula: { is: { realizadaPeloAluno: true } },
      },
      include: {
        movimentosCaixa: {
          where: { origem: "ONLINE_ASAAS_IBE" },
          select: { id: true },
        },
      },
      orderBy: { id: "asc" },
      take: 100,
    });

    let regularizados = 0;
    let acessosLiberados = 0;
    const alunosVerificados = new Set<number>();
    const pendencias: Array<{ lancamentoId: number; motivo: string }> = [];
    const cacheAsaas = new Map<string, PagamentoAsaas>();

    for (const lancamento of lancamentos) {
      const preMatricula = lancamento.matriculaId
        ? await prisma.matriculaOnlineIbe.findFirst({
            where: {
              matriculaGeradaId: lancamento.matriculaId,
              alunoGeradoId: lancamento.alunoId,
              status: "PAGO",
            },
            include: { pagamentos: true },
          })
        : null;

      if (!preMatricula) {
        pendencias.push({ lancamentoId: lancamento.id, motivo: "MATRICULA_NAO_QUITADA" });
        continue;
      }

      const valorTotal = Number(preMatricula.valorTotal);
      const partes = preMatricula.pagamentos;
      const totalPartes = partes.reduce((total, parte) => total + Number(parte.valor), 0);

      if (
        partes.length !== preMatricula.quantidadePartes ||
        partes.some((parte) => parte.status !== "PAGO" || !parte.asaasPaymentId) ||
        Math.abs(totalPartes - valorTotal) > 0.01 ||
        Math.abs(Number(lancamento.valorOriginal) - valorTotal) > 0.01 ||
        Number(preMatricula.valorPago) + 0.01 < valorTotal
      ) {
        pendencias.push({ lancamentoId: lancamento.id, motivo: "VALORES_OU_PARTES_DIVERGENTES" });
        continue;
      }

      if (lancamento.movimentosCaixa.length === 0) {
        pendencias.push({ lancamentoId: lancamento.id, motivo: "MOVIMENTO_ASAAS_NAO_LOCALIZADO" });
        continue;
      }

      try {
        let confirmado = true;

        for (const parte of partes) {
          const id = parte.asaasPaymentId!;
          let pagamento = cacheAsaas.get(id);
          if (!pagamento) {
            pagamento = await consultarPagamento(id);
            cacheAsaas.set(id, pagamento);
          }

          if (
            pagamento.id !== id ||
            !STATUS_PAGOS.has(String(pagamento.status || "").toUpperCase()) ||
            Math.abs(Number(pagamento.value) - Number(parte.valor)) > 0.01 ||
            (pagamento.externalReference &&
              pagamento.externalReference !== parte.externalReference)
          ) {
            confirmado = false;
            break;
          }
        }

        if (!confirmado) {
          pendencias.push({ lancamentoId: lancamento.id, motivo: "ASAAS_NAO_CONFIRMA_PAGAMENTO" });
          continue;
        }

        const alteracao = await prisma.$transaction(async (tx) => {
          const atualizado = await tx.lancamentoFinanceiro.updateMany({
            where: {
              id: lancamento.id,
              instituicaoId: IBE_INSTITUICAO_ID,
              status: { in: ["PENDENTE", "PARCIAL", "ATRASADO"] },
            },
            data: {
              status: "PAGO",
              valorPago: valorTotal,
              valorFinal: valorTotal,
              pagoEm: partes.reduce(
                (maisRecente, parte) =>
                  parte.pagoEm && parte.pagoEm > maisRecente ? parte.pagoEm : maisRecente,
                preMatricula.createdAt
              ),
              observacao: `Pagamento confirmado pelo Asaas. Referência: ${preMatricula.externalReference}`,
            },
          });

          if (atualizado.count === 1) {
            await tx.historicoCobranca.create({
              data: {
                instituicaoId: IBE_INSTITUICAO_ID,
                alunoId: lancamento.alunoId,
                lancamentoFinanceiroId: lancamento.id,
                responsavelId: user.id,
                canal: "SISTEMA",
                acao: "RECONCILIACAO_ASAAS",
                observacao: "Lançamento online regularizado após consulta das cobranças no Asaas.",
                metadata: { externalReference: preMatricula.externalReference },
              },
            });
          }

          return atualizado;
        });

        if (alteracao.count === 1) {
          regularizados++;
          alunosVerificados.add(lancamento.alunoId);
        }
      } catch (erro) {
        console.error("Falha na reconciliação Asaas", { lancamentoId: lancamento.id, erro });
        pendencias.push({ lancamentoId: lancamento.id, motivo: "CONSULTA_ASAAS_FALHOU" });
      }
    }

    for (const alunoId of alunosVerificados) {
      const outraPendencia = await prisma.lancamentoFinanceiro.findFirst({
        where: {
          instituicaoId: IBE_INSTITUICAO_ID,
          alunoId,
          status: "ATRASADO",
          NOT: {
            tipo: "MATRICULA",
            descricao: { startsWith: "Matrícula online IBE" },
            matricula: { is: { realizadaPeloAluno: true } },
          },
        },
        select: { id: true },
      });

      if (!outraPendencia) {
        const liberacao = await prisma.aluno.updateMany({
          where: { id: alunoId, instituicaoId: IBE_INSTITUICAO_ID, statusAluno: "INADIMPLENTE" },
          data: { statusAluno: "ATIVO" },
        });
        acessosLiberados += liberacao.count;
      }
    }

    return NextResponse.json({
      inspecionados: lancamentos.length,
      regularizados,
      acessosLiberados,
      pendencias,
      limiteAtingido: lancamentos.length === 100,
    });
  } catch (erro) {
    console.error("Erro ao reconciliar matrículas online IBE", erro);
    return NextResponse.json({ error: "Falha ao reconciliar matrículas online." }, { status: 500 });
  }
}

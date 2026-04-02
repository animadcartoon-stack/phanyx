import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function serializeTaxa(taxa: {
  id: number;
  instituicaoId: number;
  nome: string;
  descricao: string | null;
  categoria: string;
  valor: any;
  ativa: boolean;
  exigeVencimento: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...taxa,
    valor: Number(taxa.valor),
  };
}

export async function GET() {
  try {
    const user = getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const taxas = await prisma.taxaAvulsa.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(taxas.map(serializeTaxa));
  } catch (error) {
    console.error("Erro ao listar taxas avulsas:", error);
    return NextResponse.json(
      { error: "Erro ao listar taxas avulsas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const modo = String(body.modo || "CADASTRAR_TAXA").trim().toUpperCase();

    if (modo === "GERAR_LANCAMENTO") {
      const alunoId = Number(body.alunoId);
      const taxaId = Number(body.taxaId);
      const vencimento = body.vencimento ? new Date(body.vencimento) : null;
      const observacao =
        body.observacao !== undefined && body.observacao !== null
          ? String(body.observacao).trim() || null
          : null;

      if (!Number.isFinite(alunoId) || alunoId <= 0) {
        return NextResponse.json(
          { error: "Aluno inválido" },
          { status: 400 }
        );
      }

      if (!Number.isFinite(taxaId) || taxaId <= 0) {
        return NextResponse.json(
          { error: "Taxa inválida" },
          { status: 400 }
        );
      }

      const aluno = await prisma.aluno.findFirst({
        where: {
          id: alunoId,
          instituicaoId: user.instituicaoId,
        },
      });

      if (!aluno) {
        return NextResponse.json(
          { error: "Aluno não encontrado" },
          { status: 404 }
        );
      }

      const taxa = await prisma.taxaAvulsa.findFirst({
        where: {
          id: taxaId,
          instituicaoId: user.instituicaoId,
          ativa: true,
        },
      });

      if (!taxa) {
        return NextResponse.json(
          { error: "Taxa não encontrada ou inativa" },
          { status: 404 }
        );
      }

      if (taxa.exigeVencimento && !vencimento) {
        return NextResponse.json(
          { error: "Esta taxa exige vencimento" },
          { status: 400 }
        );
      }

      const valor = Number(taxa.valor);

      const lancamento = await prisma.lancamentoFinanceiro.create({
        data: {
          instituicaoId: user.instituicaoId,
          alunoId: aluno.id,
          tipo: "TAXA",
          descricao: taxa.nome,
          valorOriginal: valor,
          descontoValor: 0,
          jurosValor: 0,
          multaValor: 0,
          valorFinal: valor,
          vencimento,
          status: "PENDENTE",
          observacao:
            observacao ||
            taxa.descricao ||
            `Lançamento gerado a partir da taxa avulsa "${taxa.nome}"`,
        },
      });

      await prisma.historicoCobranca.create({
        data: {
          instituicaoId: user.instituicaoId,
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          lancamentoFinanceiroId: lancamento.id,
          responsavelId: Number(user.id) || null,
          responsavelNome: (user as any)?.nome || user.email || "Usuário",
          canal: "SISTEMA",
          acao: "TAXA_GERADA",
          observacao: `Taxa "${taxa.nome}" gerada para o aluno ${aluno.nome}.`,
          metadata: {
            taxaId: taxa.id,
            taxaNome: taxa.nome,
            categoria: taxa.categoria,
            valor,
            exigeVencimento: taxa.exigeVencimento,
          },
        },
      });

      return NextResponse.json({
        message: "Lançamento gerado com sucesso",
        data: lancamento,
      });
    }

    const nome = String(body.nome || "").trim();
    const descricao = body.descricao ? String(body.descricao).trim() : null;
    const categoria = String(body.categoria || "PERSONALIZADA")
      .trim()
      .toUpperCase();
    const valor = toNumber(body.valor);
    const ativa = body.ativa !== false;
    const exigeVencimento = body.exigeVencimento !== false;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome da taxa é obrigatório" },
        { status: 400 }
      );
    }

    if (valor < 0) {
      return NextResponse.json(
        { error: "Valor da taxa inválido" },
        { status: 400 }
      );
    }

    const taxa = await prisma.taxaAvulsa.create({
      data: {
        instituicaoId: user.instituicaoId,
        nome,
        descricao,
        categoria,
        valor,
        ativa,
        exigeVencimento,
      },
    });

    return NextResponse.json({
      message: "Taxa avulsa criada com sucesso",
      data: serializeTaxa(taxa),
    });
  } catch (error) {
    console.error("Erro ao processar taxa avulsa:", error);
    return NextResponse.json(
      { error: "Erro ao processar taxa avulsa" },
      { status: 500 }
    );
  }
}
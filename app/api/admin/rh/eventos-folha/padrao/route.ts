import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const eventos = [

              {
        codigo: "001",
        descricao: "Salário Base",
        tipo: "VENCIMENTO",
        natureza: "SALARIO",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "002",
        descricao: "Hora Extra 50%",
        tipo: "VENCIMENTO",
        natureza: "HORA_EXTRA",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "003",
        descricao: "Hora Extra 100%",
        tipo: "VENCIMENTO",
        natureza: "HORA_EXTRA",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "004",
        descricao: "Adicional Noturno",
        tipo: "VENCIMENTO",
        natureza: "ADICIONAL_NOTURNO",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "005",
        descricao: "Insalubridade",
        tipo: "VENCIMENTO",
        natureza: "INSALUBRIDADE",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "006",
        descricao: "Periculosidade",
        tipo: "VENCIMENTO",
        natureza: "PERICULOSIDADE",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "010",
        descricao: "Comissão",
        tipo: "VENCIMENTO",
        natureza: "COMISSAO",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "020",
        descricao: "Gratificação",
        tipo: "VENCIMENTO",
        natureza: "GRATIFICACAO",
        incideINSS: true,
        incideFGTS: true,
        incideIRRF: true,
      },
      {
        codigo: "100",
        descricao: "INSS",
        tipo: "DESCONTO",
        natureza: "INSS",
        incideINSS: false,
        incideFGTS: false,
        incideIRRF: false,
      },
      {
        codigo: "101",
        descricao: "IRRF",
        tipo: "DESCONTO",
        natureza: "IRRF",
        incideINSS: false,
        incideFGTS: false,
        incideIRRF: false,
      },
      {
        codigo: "102",
        descricao: "Vale Transporte",
        tipo: "DESCONTO",
        natureza: "VALE_TRANSPORTE",
        incideINSS: false,
        incideFGTS: false,
        incideIRRF: false,
      },
      {
        codigo: "103",
        descricao: "Vale Alimentação",
        tipo: "DESCONTO",
        natureza: "VALE_ALIMENTACAO",
        incideINSS: false,
        incideFGTS: false,
        incideIRRF: false,
      },
      {
        codigo: "104",
        descricao: "Plano de Saúde",
        tipo: "DESCONTO",
        natureza: "PLANO_SAUDE",
        incideINSS: false,
        incideFGTS: false,
        incideIRRF: false,
      },
      {
        codigo: "105",
        descricao: "Plano Odontológico",
        tipo: "DESCONTO",
        natureza: "PLANO_ODONTOLOGICO",
        incideINSS: false,
        incideFGTS: false,
        incideIRRF: false,
      },

    ];

        let criados = 0;
    let ignorados = 0;

    for (const evento of eventos) {
      const existente = await prisma.eventoFolhaRH.findFirst({
        where: {
          instituicaoId: user.instituicaoId!,
          codigo: evento.codigo,
        },
      });

      if (existente) {
        ignorados++;
        continue;
      }

      await prisma.eventoFolhaRH.create({
        data: {
          instituicaoId: user.instituicaoId!,
          codigo: evento.codigo,
          descricao: evento.descricao,
          tipo: evento.tipo,
          natureza: evento.natureza,
          incideINSS: evento.incideINSS,
          incideFGTS: evento.incideFGTS,
          incideIRRF: evento.incideIRRF,
          ativo: true,
        },
      });

      criados++;
    }

    return NextResponse.json({
      ok: true,
      criados,
      ignorados,
      total: eventos.length,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao importar eventos." },
      { status: 500 }
    );
  }
}
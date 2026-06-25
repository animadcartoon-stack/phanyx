import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TokenPayload = {
  id: number;
  role: string;
  email: string;
  instituicaoId: number;
};

const NOMES_RELATORIO: Record<string, string> = {
  contabil: "Relatório Contábil da Competência",
  folha: "Folha / Holerites",
  encargos: "Encargos e Provisões",
  rescisao: "Rescisões",
  ferias: "Férias",
  beneficios: "Benefícios",
  ocorrencias: "Ocorrências Funcionais",
  exames: "Exames Médicos / ASO",
  historico: "Histórico Funcional",
  arquivados: "Arquivados / Auditoria",
  geral: "Relatório Geral RH",
};

function numero(valor: any) {
  return Number(valor || 0);
}

function validarMesAno(mes: number, ano: number) {
  const mesValido = Number.isFinite(mes) && mes >= 1 && mes <= 12;
  const anoValido = Number.isFinite(ano) && ano >= 2000 && ano <= 2100;

  return {
    mes: mesValido ? mes : new Date().getMonth() + 1,
    ano: anoValido ? ano : new Date().getFullYear(),
  };
}

async function obterUsuarioLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET!
  ) as TokenPayload;

  const role = String(decoded.role || "").toUpperCase();

  const podeAcessar = [
    "ADMIN",
    "FUNCIONARIO",
    "SECRETARIA",
    "FINANCEIRO",
    "COORDENADOR",
    "SUPORTE",
    "GERENCIA",
  ].includes(role);

  if (!podeAcessar) {
    return null;
  }

  if (!decoded.instituicaoId) {
    return null;
  }

  return decoded;
}

export async function GET(req: Request) {
  try {
    const usuario = await obterUsuarioLogado();

    if (!usuario) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const mesParam = Number(searchParams.get("mes"));
    const anoParam = Number(searchParams.get("ano"));
    const tipoParam = String(searchParams.get("tipo") || "contabil");

    const { mes, ano } = validarMesAno(mesParam, anoParam);

    const tipo = NOMES_RELATORIO[tipoParam] ? tipoParam : "contabil";

    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 1);

    const instituicaoId = Number(usuario.instituicaoId);

    const [
      instituicao,
      holerites,
      rescisoes,
      ferias,
      beneficios,
      ocorrencias,
      exames,
      historicos,
      documentosArquivados,
      feriasArquivadas,
      examesArquivados,
      rescisoesArquivadas,
      holeritesArquivados,
      ocorrenciasArquivadas,
    ] = await Promise.all([
      prisma.instituicao.findUnique({
  where: { id: instituicaoId },
  select: {
    id: true,
    nome: true,
  },
}),

      prisma.holeriteRH.findMany({
        where: {
          instituicaoId,
          competenciaMes: mes,
          competenciaAno: ano,
          arquivado: false,
          cancelado: false,
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      }),

      prisma.rescisaoRH.findMany({
        where: {
          instituicaoId,
          arquivada: false,
          cancelada: false,
          dataDesligamento: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataDesligamento: "desc",
        },
      }),

      prisma.feriasRH.findMany({
        where: {
          instituicaoId,
          arquivada: false,
          cancelada: false,
          OR: [
            {
              dataInicio: {
                gte: inicio,
                lt: fim,
              },
            },
            {
              dataPagamento: {
                gte: inicio,
                lt: fim,
              },
            },
          ],
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataInicio: "desc",
        },
      }),

      prisma.funcionarioBeneficioRH.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          beneficio: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              valorPadrao: true,
              percentual: true,
              descontaFolha: true,
              ativo: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      }),

      prisma.ocorrenciaRH.findMany({
        where: {
          instituicaoId,
          arquivada: false,
          dataEvento: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataEvento: "desc",
        },
      }),

      prisma.exameMedicoRH.findMany({
        where: {
          instituicaoId,
          arquivado: false,
          cancelado: false,
          dataExame: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataExame: "desc",
        },
      }),

      prisma.historicoRH.findMany({
        where: {
          instituicaoId,
          dataEvento: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataEvento: "desc",
        },
      }),

      prisma.documentoRH.findMany({
        where: {
          instituicaoId,
          arquivado: true,
          arquivadoEm: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          arquivadoPor: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          arquivadoEm: "desc",
        },
      }),

      prisma.feriasRH.findMany({
        where: {
          instituicaoId,
          arquivada: true,
          arquivadaEm: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          arquivadaPor: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          arquivadaEm: "desc",
        },
      }),

      prisma.exameMedicoRH.findMany({
        where: {
          instituicaoId,
          arquivado: true,
          arquivadoEm: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          arquivadoPor: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          arquivadoEm: "desc",
        },
      }),

      prisma.rescisaoRH.findMany({
        where: {
          instituicaoId,
          arquivada: true,
          arquivadaEm: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          arquivadaPor: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          arquivadaEm: "desc",
        },
      }),

      prisma.holeriteRH.findMany({
        where: {
          instituicaoId,
          arquivado: true,
          arquivadoEm: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          arquivadoPor: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          arquivadoEm: "desc",
        },
      }),

      prisma.ocorrenciaRH.findMany({
        where: {
          instituicaoId,
          arquivada: true,
          arquivadaEm: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          arquivadaPor: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          arquivadaEm: "desc",
        },
      }),
    ]);

    const totais = holerites.reduce(
      (acc, item: any) => {
        acc.salarios += numero(item.salarioBase || item.salario);
        acc.vencimentos += numero(item.totalVencimentos);
        acc.descontos += numero(item.totalDescontos);
        acc.liquido += numero(item.valorLiquido);
        return acc;
      },
      {
        salarios: 0,
        vencimentos: 0,
        descontos: 0,
        liquido: 0,
      }
    );

    const encargosEstimados = {
      inssPatronal: totais.salarios * 0.2,
      fgts: totais.salarios * 0.08,
      provisaoFerias: totais.salarios / 12,
      provisaoDecimo: totais.salarios / 12,
    };

    const totalEncargosEstimados =
      encargosEstimados.inssPatronal +
      encargosEstimados.fgts +
      encargosEstimados.provisaoFerias +
      encargosEstimados.provisaoDecimo;

    const totalRescisoes = rescisoes.reduce((total: number, item: any) => {
      return total + numero(item.valorLiquidoRescisao || item.valorRescisao);
    }, 0);

    const totalFerias = ferias.reduce((total: number, item: any) => {
      return total + numero(item.valorLiquidoFerias || item.valorFerias);
    }, 0);

    const totalBeneficios = beneficios.reduce((total: number, item: any) => {
      const valor =
        item.valor ??
        item.beneficio?.valorPadrao ??
        0;

      return total + numero(valor);
    }, 0);

    const arquivados = [
      ...documentosArquivados.map((item: any) => ({
        origem: "DOCUMENTO_RH",
        id: item.id,
        titulo: item.titulo,
        tipo: item.tipo,
        funcionario: item.funcionario,
        arquivadoEm: item.arquivadoEm,
        arquivadoPor: item.arquivadoPor,
        motivoArquivo: item.motivoArquivo,
      })),
      ...feriasArquivadas.map((item: any) => ({
        origem: "FERIAS",
        id: item.id,
        titulo: "Férias arquivadas",
        tipo: item.status,
        funcionario: item.funcionario,
        arquivadoEm: item.arquivadaEm,
        arquivadoPor: item.arquivadaPor,
        motivoArquivo: item.motivoArquivo,
      })),
      ...examesArquivados.map((item: any) => ({
        origem: "EXAME_MEDICO",
        id: item.id,
        titulo: "Exame médico arquivado",
        tipo: item.tipo,
        funcionario: item.funcionario,
        arquivadoEm: item.arquivadoEm,
        arquivadoPor: item.arquivadoPor,
        motivoArquivo: item.motivoArquivo,
      })),
      ...rescisoesArquivadas.map((item: any) => ({
        origem: "RESCISAO",
        id: item.id,
        titulo: "Rescisão arquivada",
        tipo: item.tipo,
        funcionario: item.funcionario,
        arquivadoEm: item.arquivadaEm,
        arquivadoPor: item.arquivadaPor,
        motivoArquivo: item.motivoArquivo,
      })),
      ...holeritesArquivados.map((item: any) => ({
        origem: "HOLERITE",
        id: item.id,
        titulo: "Holerite arquivado",
        tipo: `${String(item.competenciaMes).padStart(2, "0")}/${item.competenciaAno}`,
        funcionario: item.funcionario,
        arquivadoEm: item.arquivadoEm,
        arquivadoPor: item.arquivadoPor,
        motivoArquivo: item.motivoArquivo,
      })),
      ...ocorrenciasArquivadas.map((item: any) => ({
        origem: "OCORRENCIA",
        id: item.id,
        titulo: "Ocorrência arquivada",
        tipo: item.tipo,
        funcionario: item.funcionario,
        arquivadoEm: item.arquivadaEm,
        arquivadoPor: item.arquivadaPor,
        motivoArquivo: item.motivoArquivo,
      })),
    ].sort((a: any, b: any) => {
      return (
        new Date(b.arquivadoEm || 0).getTime() -
        new Date(a.arquivadoEm || 0).getTime()
      );
    });

    return NextResponse.json(
      {
        relatorio: {
          tipo,
          nome: NOMES_RELATORIO[tipo],
          competencia: `${String(mes).padStart(2, "0")}/${ano}`,
          emitidoEm: new Date().toISOString(),
        },
        instituicao,
        mes,
        ano,
        periodo: {
          inicio,
          fim,
        },
        totais,
        encargosEstimados,
        totalEncargosEstimados,
        totalRescisoes,
        totalFerias,
        totalBeneficios,
        indicadores: {
          holerites: holerites.length,
          rescisoes: rescisoes.length,
          ferias: ferias.length,
          beneficios: beneficios.length,
          ocorrencias: ocorrencias.length,
          exames: exames.length,
          historicos: historicos.length,
          arquivados: arquivados.length,
        },
        holerites,
        rescisoes,
        ferias,
        beneficios,
        ocorrencias,
        exames,
        historicos,
        arquivados,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao carregar contabilidade RH:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao carregar dados da contabilidade RH.",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const TIPOS_VALIDOS = [
  "ALUNO",
  "PROFESSOR",
  "FUNCIONARIO",
  "VISITANTE",
  "MEMBRO",
  "PERSONALIZADO",
];

const FORMATOS_VALIDOS = [
  "RETRATO",
  "PAISAGEM",
  "QUADRADO",
  "REDONDO",
  "PERSONALIZADO",
];

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarTipoPessoa(valor: unknown) {
  const tipo = limparTexto(valor).toUpperCase();

  if (TIPOS_VALIDOS.includes(tipo)) return tipo;

  return "ALUNO";
}

function normalizarFormato(valor: unknown) {
  const formato = limparTexto(valor).toUpperCase();

  if (FORMATOS_VALIDOS.includes(formato)) return formato;

  return "RETRATO";
}

function medidasPadraoPorFormato(formato: string) {
  if (formato === "PAISAGEM") {
    return { larguraMm: 86, alturaMm: 54 };
  }

  if (formato === "QUADRADO") {
    return { larguraMm: 70, alturaMm: 70 };
  }

  if (formato === "REDONDO") {
    return { larguraMm: 60, alturaMm: 60 };
  }

  return { larguraMm: 54, alturaMm: 86 };
}

function jsonSeguro(valor: unknown, padrao: unknown) {
  if (valor === undefined || valor === null) return padrao;
  return valor;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const tipoPessoa = limparTexto(searchParams.get("tipoPessoa")).toUpperCase();
    const somentePadrao = searchParams.get("padrao") === "true";

    const where: any = {
      instituicaoId: user.instituicaoId,
      ativo: true,
    };

    if (tipoPessoa && TIPOS_VALIDOS.includes(tipoPessoa)) {
      where.tipoPessoa = tipoPessoa;
    }

    if (somentePadrao) {
      where.padrao = true;
    }

    const modelos = await prisma.crachaModelo.findMany({
      where,
      orderBy: [
        { padrao: "desc" },
        { atualizadoEm: "desc" },
      ],
    });

    return NextResponse.json({ modelos });
  } catch (error) {
    console.error("ERRO AO LISTAR MODELOS DE CRACHÁ:", error);

    return NextResponse.json(
      { error: "Erro ao listar modelos de crachá." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const id = body.id ? Number(body.id) : null;

    const tipoPessoa = normalizarTipoPessoa(
      body.tipoPessoa || body.tipoModelo
    );

    const formato = normalizarFormato(body.formato);

    const medidasPadrao = medidasPadraoPorFormato(formato);

    const nome =
      limparTexto(body.nome) ||
      `Modelo padrão - ${tipoPessoa.charAt(0)}${tipoPessoa
        .slice(1)
        .toLowerCase()}`;

    const larguraMm = Number(body.larguraMm || medidasPadrao.larguraMm);
    const alturaMm = Number(body.alturaMm || medidasPadrao.alturaMm);

    const padrao = body.padrao !== false;

    const dadosModelo = {
  nome,
  tipoPessoa,
  formato,

  larguraMm,
  alturaMm,

  tipoFuro: limparTexto(body.tipoFuro) || "RASGO_HORIZONTAL",

  tipoFundoFrente: limparTexto(body.tipoFundoFrente) || "SOLIDO",
  corFundoFrente: limparTexto(body.corFundoFrente) || "#ffffff",
  corFundoFrenteSecundaria:
    limparTexto(body.corFundoFrenteSecundaria) || null,
  direcaoGradienteFrente:
    limparTexto(body.direcaoGradienteFrente) || "VERTICAL",

  tipoFundoVerso: limparTexto(body.tipoFundoVerso) || "SOLIDO",
  corFundoVerso: limparTexto(body.corFundoVerso) || "#ffffff",
  corFundoVersoSecundaria:
    limparTexto(body.corFundoVersoSecundaria) || null,
  direcaoGradienteVerso:
    limparTexto(body.direcaoGradienteVerso) || "VERTICAL",

  frenteJson: jsonSeguro(
    body.frenteJson ?? body.objetosFrente,
    []
  ) as any,

  versoJson: jsonSeguro(
    body.versoJson ?? body.objetosVerso,
    []
  ) as any,

  padrao,
  ativo: body.ativo !== false,
  observacoes: limparTexto(body.observacoes) || null,
};

    const modelo = await prisma.$transaction(async (tx) => {
  if (id) {
    const modeloExistente = await tx.crachaModelo.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId!,
      },
    });

    if (!modeloExistente) {
      throw new Error("Modelo de crachá não encontrado.");
    }

    if (padrao) {
      await tx.crachaModelo.updateMany({
        where: {
          instituicaoId: user.instituicaoId!,
          tipoPessoa,
          padrao: true,
          id: { not: id },
        },
        data: {
          padrao: false,
        },
      });
    }

    return tx.crachaModelo.update({
      where: { id },
      data: dadosModelo,
    });
  }

  const modeloPadraoExistente = padrao
    ? await tx.crachaModelo.findFirst({
        where: {
          instituicaoId: user.instituicaoId!,
          tipoPessoa,
          padrao: true,
          ativo: true,
        },
        orderBy: {
          atualizadoEm: "desc",
        },
      })
    : null;

  if (modeloPadraoExistente) {
    return tx.crachaModelo.update({
      where: { id: modeloPadraoExistente.id },
      data: dadosModelo,
    });
  }

  if (padrao) {
    await tx.crachaModelo.updateMany({
      where: {
        instituicaoId: user.instituicaoId!,
        tipoPessoa,
        padrao: true,
      },
      data: {
        padrao: false,
      },
    });
  }

  return tx.crachaModelo.create({
    data: {
      instituicaoId: user.instituicaoId!,
      criadoPorId: user.id,
      ...dadosModelo,
    },
  });
});

    return NextResponse.json({ modelo });
  } catch (error: any) {
    console.error("ERRO AO SALVAR MODELO DE CRACHÁ:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao salvar modelo de crachá." },
      { status: 500 }
    );
  }
}
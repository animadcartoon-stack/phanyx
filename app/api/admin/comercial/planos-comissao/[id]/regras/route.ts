import { NextResponse } from "next/server";
import {
  BaseCalculoComissaoRH,
  GatilhoComissaoRH,
  TipoRegraComissaoRH,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temPermissao,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    id: string;
  };
};

const TIPOS_VALIDOS = Object.values(
  TipoRegraComissaoRH
);

const BASES_VALIDAS = Object.values(
  BaseCalculoComissaoRH
);

const GATILHOS_VALIDOS = Object.values(
  GatilhoComissaoRH
);

function numeroPositivoOuNull(
  valor: unknown
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

function inteiroNaoNegativoOuNull(
  valor: unknown
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    return null;
  }

  return numero;
}

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function booleanoOuPadrao(
  valor: unknown,
  padrao: boolean
) {
  return typeof valor === "boolean"
    ? valor
    : padrao;
}

async function buscarPlano(
  planoId: number,
  instituicaoId: number
) {
  return prisma.planoComissaoRH.findFirst({
    where: {
      id: planoId,
      instituicaoId,
    },
    select: {
      id: true,
      nome: true,
      ativo: true,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (
      !temPermissao(
        user,
        "comercial.configuracoes.gerenciar"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para visualizar regras de comissão.",
        },
        { status: 403 }
      );
    }

    const planoId = Number(params.id);

    if (
      !Number.isInteger(planoId) ||
      planoId <= 0
    ) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const plano = await buscarPlano(
      planoId,
      user.instituicaoId
    );

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano de comissão não encontrado.",
        },
        { status: 404 }
      );
    }

    const regras =
      await prisma.regraComissaoRH.findMany({
        where: {
          planoId,
          instituicaoId: user.instituicaoId,
        },
        include: {
          curso: {
            select: {
              id: true,
              nome: true,
              ativo: true,
            },
          },
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: [
          {
            ordem: "asc",
          },
          {
            criadoEm: "asc",
          },
        ],
      });

    return NextResponse.json({
      plano,
      regras,
    });
  } catch (error) {
    console.error(
      "Erro ao listar regras de comissão:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar as regras de comissão.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: ContextoRota
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    if (
      !temPermissao(
        user,
        "comercial.configuracoes.gerenciar"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para criar regras de comissão.",
        },
        { status: 403 }
      );
    }

    const instituicaoId = user.instituicaoId;
    const planoId = Number(params.id);

    if (
      !Number.isInteger(planoId) ||
      planoId <= 0
    ) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const plano = await buscarPlano(
      planoId,
      instituicaoId
    );

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano de comissão não encontrado.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const nome = String(body?.nome ?? "").trim();
    const descricao = textoOuNull(
      body?.descricao
    );

    const tipo = String(
      body?.tipo ?? ""
    ).toUpperCase() as TipoRegraComissaoRH;

    const baseCalculo = String(
      body?.baseCalculo ?? ""
    ).toUpperCase() as BaseCalculoComissaoRH;

    const gatilho = String(
      body?.gatilho ?? ""
    ).toUpperCase() as GatilhoComissaoRH;

    const percentual = numeroPositivoOuNull(
      body?.percentual
    );

    const valorFixo = numeroPositivoOuNull(
      body?.valorFixo
    );

    const cursoId = numeroPositivoOuNull(
      body?.cursoId
    );

    const quantidadeMinima =
      inteiroNaoNegativoOuNull(
        body?.quantidadeMinima
      );

    const quantidadeMaxima =
      inteiroNaoNegativoOuNull(
        body?.quantidadeMaxima
      );

    const diasCarenciaEstorno =
      inteiroNaoNegativoOuNull(
        body?.diasCarenciaEstorno
      );

    const ordem =
      inteiroNaoNegativoOuNull(
        body?.ordem
      ) ?? 0;

    const usarValorLiquidoRecebido =
      booleanoOuPadrao(
        body?.usarValorLiquidoRecebido,
        true
      );

    const estornarEmCancelamento =
      booleanoOuPadrao(
        body?.estornarEmCancelamento,
        true
      );

    const estornarEmInadimplencia =
      booleanoOuPadrao(
        body?.estornarEmInadimplencia,
        false
      );

    const ativo = booleanoOuPadrao(
      body?.ativo,
      true
    );

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Informe o nome da regra de comissão.",
        },
        { status: 400 }
      );
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        {
          error:
            "O tipo da regra é inválido.",
        },
        { status: 400 }
      );
    }

    if (!BASES_VALIDAS.includes(baseCalculo)) {
      return NextResponse.json(
        {
          error:
            "A base de cálculo é inválida.",
        },
        { status: 400 }
      );
    }

    if (!GATILHOS_VALIDOS.includes(gatilho)) {
      return NextResponse.json(
        {
          error:
            "O gatilho da comissão é inválido.",
        },
        { status: 400 }
      );
    }

    if (
      tipo === TipoRegraComissaoRH.PERCENTUAL &&
      (!percentual || percentual > 100)
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um percentual maior que zero e de no máximo 100%.",
        },
        { status: 400 }
      );
    }

    if (
      tipo === TipoRegraComissaoRH.VALOR_FIXO &&
      !valorFixo
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o valor fixo da comissão.",
        },
        { status: 400 }
      );
    }

    if (
      baseCalculo ===
        BaseCalculoComissaoRH.QUANTIDADE_MATRICULAS &&
      tipo === TipoRegraComissaoRH.PERCENTUAL
    ) {
      return NextResponse.json(
        {
          error:
            "A base por quantidade de matrículas deve utilizar comissão por valor fixo.",
        },
        { status: 400 }
      );
    }

    if (
      quantidadeMinima !== null &&
      quantidadeMaxima !== null &&
      quantidadeMaxima < quantidadeMinima
    ) {
      return NextResponse.json(
        {
          error:
            "A quantidade máxima não pode ser menor que a quantidade mínima.",
        },
        { status: 400 }
      );
    }

    if (cursoId) {
      const curso = await prisma.curso.findFirst({
        where: {
          id: cursoId,
          instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
        },
      });

      if (!curso) {
        return NextResponse.json(
          {
            error:
              "O curso informado não pertence à instituição ou está inativo.",
          },
          { status: 400 }
        );
      }
    }

    const regraComMesmoNome =
      await prisma.regraComissaoRH.findFirst({
        where: {
          instituicaoId,
          planoId,
          nome: {
            equals: nome,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (regraComMesmoNome) {
      return NextResponse.json(
        {
          error:
            "Já existe uma regra com esse nome neste plano.",
        },
        { status: 409 }
      );
    }

    const regra =
      await prisma.regraComissaoRH.create({
        data: {
          instituicaoId,
          planoId,
          cursoId: cursoId
            ? Number(cursoId)
            : null,
          criadoPorId: user.id,

          nome,
          descricao,

          tipo,
          baseCalculo,
          gatilho,

          percentual:
            tipo ===
            TipoRegraComissaoRH.PERCENTUAL
              ? percentual
              : null,

          valorFixo:
            tipo ===
            TipoRegraComissaoRH.VALOR_FIXO
              ? valorFixo
              : null,

          quantidadeMinima,
          quantidadeMaxima,

          usarValorLiquidoRecebido,
          estornarEmCancelamento,
          estornarEmInadimplencia,
          diasCarenciaEstorno,

          ordem,
          ativo,
        },
        include: {
          curso: {
            select: {
              id: true,
              nome: true,
            },
          },
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        message:
          "Regra de comissão criada com sucesso.",
        regra,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao criar regra de comissão:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível criar a regra de comissão.",
      },
      { status: 500 }
    );
  }
}
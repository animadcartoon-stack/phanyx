import { NextResponse } from "next/server";
import {
  BaseCalculoComissaoRH,
  EscopoRegraComissaoRH,
  GatilhoComissaoRH,
  ModoParticipacaoPlanoComissaoRH,
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
  TipoRegraComissaoRH,
);

const BASES_VALIDAS = Object.values(
  BaseCalculoComissaoRH,
);

const GATILHOS_VALIDOS = Object.values(
  GatilhoComissaoRH,
);

const ESCOPOS_VALIDOS = Object.values(
  EscopoRegraComissaoRH,
);

const MODOS_PARTICIPACAO_VALIDOS = Object.values(
  ModoParticipacaoPlanoComissaoRH,
);

function numeroPositivoOuNull(
  valor: unknown,
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

function inteiroPositivoOuNull(
  valor: unknown,
): number | null {
  const numero = numeroPositivoOuNull(valor);

  if (numero === null || !Number.isInteger(numero)) {
    return null;
  }

  return numero;
}

function inteiroNaoNegativoOuNull(
  valor: unknown,
): number | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 0) {
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
  padrao: boolean,
) {
  return typeof valor === "boolean"
    ? valor
    : padrao;
}

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function buscarPlano(
  planoId: number,
  instituicaoId: number,
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
      modoParticipacao: true,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: ContextoRota,
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 },
      );
    }

    if (
      !temPermissao(
        user,
        "comercial.configuracoes.gerenciar",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para visualizar regras de comissão.",
        },
        { status: 403 },
      );
    }

    const planoId = Number(params.id);

    if (
      !Number.isInteger(planoId) ||
      planoId <= 0
    ) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 },
      );
    }

    const plano = await buscarPlano(
      planoId,
      user.instituicaoId,
    );

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano de comissão não encontrado.",
        },
        { status: 404 },
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
          regraBase: {
            select: {
              id: true,
              nome: true,
              escopoAplicacao: true,
            },
          },
          _count: {
            select: {
              variacoes: true,
            },
          },
        },
        orderBy: [
          {
            ordem: "asc",
          },
          {
            regraBaseId: "asc",
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
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar as regras de comissão.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: ContextoRota,
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 },
      );
    }

    if (
      !temPermissao(
        user,
        "comercial.configuracoes.gerenciar",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para alterar este plano de comissão.",
        },
        { status: 403 },
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
        { status: 400 },
      );
    }

    const plano = await buscarPlano(
      planoId,
      instituicaoId,
    );

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano de comissão não encontrado.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const modoParticipacao = String(
      body?.modoParticipacao ?? "",
    ).toUpperCase() as ModoParticipacaoPlanoComissaoRH;

    if (
      !MODOS_PARTICIPACAO_VALIDOS.includes(
        modoParticipacao,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "O modo de participação do plano é inválido.",
        },
        { status: 400 },
      );
    }

    const atualizado =
      await prisma.planoComissaoRH.updateMany({
        where: {
          id: planoId,
          instituicaoId,
        },
        data: {
          modoParticipacao,
        },
      });

    if (atualizado.count !== 1) {
      return NextResponse.json(
        {
          error:
            "O plano foi alterado e não pôde ser atualizado.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message:
        "Modo de participação do plano atualizado com sucesso.",
      plano: {
        ...plano,
        modoParticipacao,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar modo de participação do plano:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível atualizar o modo de participação do plano.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: ContextoRota,
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 },
      );
    }

    if (
      !temPermissao(
        user,
        "comercial.configuracoes.gerenciar",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para criar regras de comissão.",
        },
        { status: 403 },
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
        { status: 400 },
      );
    }

    const plano = await buscarPlano(
      planoId,
      instituicaoId,
    );

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Plano de comissão não encontrado.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const nome = String(body?.nome ?? "").trim();
    const descricao = textoOuNull(
      body?.descricao,
    );

    const regraBaseId = inteiroPositivoOuNull(
      body?.regraBaseId,
    );

    const escopoAplicacao = String(
      body?.escopoAplicacao ??
        EscopoRegraComissaoRH.GERAL,
    ).toUpperCase() as EscopoRegraComissaoRH;

    const tipoInformado = String(
      body?.tipo ?? "",
    ).toUpperCase() as TipoRegraComissaoRH;

    const baseCalculoInformada = String(
      body?.baseCalculo ?? "",
    ).toUpperCase() as BaseCalculoComissaoRH;

    const gatilhoInformado = String(
      body?.gatilho ?? "",
    ).toUpperCase() as GatilhoComissaoRH;

    const percentual = numeroPositivoOuNull(
      body?.percentual,
    );

    const valorFixo = numeroPositivoOuNull(
      body?.valorFixo,
    );

    const cursoIdInformado = inteiroPositivoOuNull(
      body?.cursoId,
    );

    const quantidadeMinimaInformada =
      inteiroNaoNegativoOuNull(
        body?.quantidadeMinima,
      );

    const quantidadeMaximaInformada =
      inteiroNaoNegativoOuNull(
        body?.quantidadeMaxima,
      );

    const diasCarenciaEstornoInformado =
      inteiroNaoNegativoOuNull(
        body?.diasCarenciaEstorno,
      );

    const ordemInformada =
      inteiroNaoNegativoOuNull(
        body?.ordem,
      ) ?? 0;

    const usarValorLiquidoRecebidoInformado =
      booleanoOuPadrao(
        body?.usarValorLiquidoRecebido,
        true,
      );

    const estornarEmCancelamentoInformado =
      booleanoOuPadrao(
        body?.estornarEmCancelamento,
        true,
      );

    const estornarEmInadimplenciaInformado =
      booleanoOuPadrao(
        body?.estornarEmInadimplencia,
        false,
      );

    const ativo = booleanoOuPadrao(
      body?.ativo,
      true,
    );

    const departamentoAlvoIdInformado =
      inteiroPositivoOuNull(
        body?.departamentoAlvoId,
      );

    const cargoAlvoInformado = textoOuNull(
      body?.cargoAlvo,
    );

    const funcionarioAlvoIdInformado =
      inteiroPositivoOuNull(
        body?.funcionarioAlvoId,
      );

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Informe o nome da regra de comissão.",
        },
        { status: 400 },
      );
    }

    if (
      !ESCOPOS_VALIDOS.includes(
        escopoAplicacao,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "O escopo de aplicação da regra é inválido.",
        },
        { status: 400 },
      );
    }

    if (
      escopoAplicacao ===
        EscopoRegraComissaoRH.GERAL &&
      regraBaseId !== null
    ) {
      return NextResponse.json(
        {
          error:
            "Uma regra geral não pode ser vinculada a outra regra-base.",
        },
        { status: 400 },
      );
    }

    if (
      escopoAplicacao !==
        EscopoRegraComissaoRH.GERAL &&
      regraBaseId === null
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione a regra geral que receberá esta exceção.",
        },
        { status: 400 },
      );
    }

    const regraBase = regraBaseId
      ? await prisma.regraComissaoRH.findFirst({
          where: {
            id: regraBaseId,
            instituicaoId,
            planoId,
            regraBaseId: null,
            escopoAplicacao:
              EscopoRegraComissaoRH.GERAL,
          },
          select: {
            id: true,
            nome: true,
            tipo: true,
            baseCalculo: true,
            gatilho: true,
            cursoId: true,
            quantidadeMinima: true,
            quantidadeMaxima: true,
            usarValorLiquidoRecebido: true,
            estornarEmCancelamento: true,
            estornarEmInadimplencia: true,
            diasCarenciaEstorno: true,
            ordem: true,
          },
        })
      : null;

    if (regraBaseId && !regraBase) {
      return NextResponse.json(
        {
          error:
            "A regra geral selecionada não pertence a este plano.",
        },
        { status: 400 },
      );
    }

    const tipo = regraBase
      ? regraBase.tipo
      : tipoInformado;

    const baseCalculo = regraBase
      ? regraBase.baseCalculo
      : baseCalculoInformada;

    const gatilho = regraBase
      ? regraBase.gatilho
      : gatilhoInformado;

    const cursoId = regraBase
      ? regraBase.cursoId
      : cursoIdInformado;

    const quantidadeMinima = regraBase
      ? regraBase.quantidadeMinima
      : quantidadeMinimaInformada;

    const quantidadeMaxima = regraBase
      ? regraBase.quantidadeMaxima
      : quantidadeMaximaInformada;

    const usarValorLiquidoRecebido = regraBase
      ? regraBase.usarValorLiquidoRecebido
      : usarValorLiquidoRecebidoInformado;

    const estornarEmCancelamento = regraBase
      ? regraBase.estornarEmCancelamento
      : estornarEmCancelamentoInformado;

    const estornarEmInadimplencia = regraBase
      ? regraBase.estornarEmInadimplencia
      : estornarEmInadimplenciaInformado;

    const diasCarenciaEstorno = regraBase
      ? regraBase.diasCarenciaEstorno
      : diasCarenciaEstornoInformado;

    const ordem = regraBase
      ? regraBase.ordem
      : ordemInformada;

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        {
          error:
            "O tipo da regra é inválido.",
        },
        { status: 400 },
      );
    }

    if (!BASES_VALIDAS.includes(baseCalculo)) {
      return NextResponse.json(
        {
          error:
            "A base de cálculo é inválida.",
        },
        { status: 400 },
      );
    }

    if (!GATILHOS_VALIDOS.includes(gatilho)) {
      return NextResponse.json(
        {
          error:
            "O gatilho da comissão é inválido.",
        },
        { status: 400 },
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
        { status: 400 },
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
        { status: 400 },
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
        { status: 400 },
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
        { status: 400 },
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
          { status: 400 },
        );
      }
    }

    let departamentoAlvoId: number | null = null;
    let departamentoAlvoNomeSnapshot: string | null = null;
    let cargoAlvo: string | null = null;
    let cargoAlvoNormalizado: string | null = null;
    let funcionarioAlvoId: number | null = null;
    let funcionarioAlvoNomeSnapshot: string | null = null;

    if (
      escopoAplicacao ===
      EscopoRegraComissaoRH.DEPARTAMENTO
    ) {
      if (!departamentoAlvoIdInformado) {
        return NextResponse.json(
          {
            error:
              "Selecione o departamento desta regra.",
          },
          { status: 400 },
        );
      }

      const funcionarioDepartamento =
        await prisma.funcionario.findFirst({
          where: {
            instituicaoId,
            departamentoId:
              departamentoAlvoIdInformado,
            ativo: true,
            statusFuncionario: "ATIVO",
          },
          select: {
            departamento: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        });

      const departamento =
        funcionarioDepartamento?.departamento;

      if (!departamento) {
        return NextResponse.json(
          {
            error:
              "O departamento não pertence à instituição ou não possui funcionários ativos.",
          },
          { status: 400 },
        );
      }

      departamentoAlvoId = departamento.id;
      departamentoAlvoNomeSnapshot =
        departamento.nome;
    }

    if (
      escopoAplicacao ===
      EscopoRegraComissaoRH.CARGO
    ) {
      const cargoNormalizado = normalizarTexto(
        cargoAlvoInformado,
      );

      if (!cargoNormalizado) {
        return NextResponse.json(
          {
            error:
              "Informe o cargo ou a função desta regra.",
          },
          { status: 400 },
        );
      }

      const cargos =
        await prisma.funcionario.findMany({
          where: {
            instituicaoId,
            ativo: true,
            statusFuncionario: "ATIVO",
            cargo: {
              not: null,
            },
          },
          select: {
            cargo: true,
          },
          distinct: ["cargo"],
        });

      const cargoEncontrado = cargos.find(
        (item) =>
          normalizarTexto(item.cargo) ===
          cargoNormalizado,
      )?.cargo;

      if (!cargoEncontrado) {
        return NextResponse.json(
          {
            error:
              "Nenhum funcionário ativo possui o cargo ou a função informada.",
          },
          { status: 400 },
        );
      }

      cargoAlvo = cargoEncontrado;
      cargoAlvoNormalizado = cargoNormalizado;
    }

    if (
      escopoAplicacao ===
      EscopoRegraComissaoRH.FUNCIONARIO
    ) {
      if (!funcionarioAlvoIdInformado) {
        return NextResponse.json(
          {
            error:
              "Selecione o funcionário desta regra.",
          },
          { status: 400 },
        );
      }

      const funcionarioAlvo =
        await prisma.funcionario.findFirst({
          where: {
            id: funcionarioAlvoIdInformado,
            instituicaoId,
            ativo: true,
            statusFuncionario: "ATIVO",
          },
          select: {
            id: true,
            nome: true,
          },
        });

      if (!funcionarioAlvo) {
        return NextResponse.json(
          {
            error:
              "O funcionário não pertence à instituição ou está inativo.",
          },
          { status: 400 },
        );
      }

      funcionarioAlvoId = funcionarioAlvo.id;
      funcionarioAlvoNomeSnapshot =
        funcionarioAlvo.nome;
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
        { status: 409 },
      );
    }

    if (regraBaseId) {
      const regraDoMesmoEscopo =
        await prisma.regraComissaoRH.findFirst({
          where: {
            instituicaoId,
            planoId,
            regraBaseId,
            escopoAplicacao,
            ...(escopoAplicacao ===
            EscopoRegraComissaoRH.DEPARTAMENTO
              ? {
                  departamentoAlvoId,
                }
              : {}),
            ...(escopoAplicacao ===
            EscopoRegraComissaoRH.CARGO
              ? {
                  cargoAlvoNormalizado,
                }
              : {}),
            ...(escopoAplicacao ===
            EscopoRegraComissaoRH.FUNCIONARIO
              ? {
                  funcionarioAlvoId,
                }
              : {}),
          },
          select: {
            id: true,
            nome: true,
          },
        });

      if (regraDoMesmoEscopo) {
        return NextResponse.json(
          {
            error:
              `Já existe a regra “${regraDoMesmoEscopo.nome}” para esse alvo dentro do mesmo grupo de comissão.`,
          },
          { status: 409 },
        );
      }
    }

    const regra =
      await prisma.regraComissaoRH.create({
        data: {
          instituicaoId,
          planoId,
          cursoId,
          criadoPorId: user.id,
          regraBaseId,
          escopoAplicacao,
          departamentoAlvoId,
          departamentoAlvoNomeSnapshot,
          cargoAlvo,
          cargoAlvoNormalizado,
          funcionarioAlvoId,
          funcionarioAlvoNomeSnapshot,
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
          regraBase: {
            select: {
              id: true,
              nome: true,
              escopoAplicacao: true,
            },
          },
          _count: {
            select: {
              variacoes: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        message:
          regraBaseId === null
            ? "Regra geral de comissão criada com sucesso."
            : "Exceção de comissão criada com sucesso.",
        regra,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Erro ao criar regra de comissão:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível criar a regra de comissão.",
      },
      { status: 500 },
    );
  }
}
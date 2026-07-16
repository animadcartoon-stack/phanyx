import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    slug: string;
  };
};

function normalizarSlug(valor: unknown) {
  try {
    return decodeURIComponent(String(valor || ""))
      .trim()
      .toLowerCase();
  } catch {
    return String(valor || "")
      .trim()
      .toLowerCase();
  }
}

function obterDataLocal(
  data: Date,
  fusoHorario: string
) {
  try {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: fusoHorario,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(data);

    const ano =
      partes.find((parte) => parte.type === "year")
        ?.value || "";

    const mes =
      partes.find((parte) => parte.type === "month")
        ?.value || "";

    const dia =
      partes.find((parte) => parte.type === "day")
        ?.value || "";

    if (!ano || !mes || !dia) {
      return "";
    }

    return `${ano}-${mes}-${dia}`;
  } catch {
    return data.toISOString().slice(0, 10);
  }
}

export async function GET(
  _req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const slug = normalizarSlug(
      contexto.params.slug
    );

    if (!slug) {
      return NextResponse.json(
        {
          error: "Instituição não identificada.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Sua sessão expirou. Entre novamente no RH Ponto.",
        },
        {
          status: 401,
        }
      );
    }

    const usuarioId = Number(user.id);
    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0 ||
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário ou instituição não identificado.",
        },
        {
          status: 401,
        }
      );
    }

    const agora = new Date();

    const [
      instituicao,
      configuracao,
      funcionario,
    ] = await Promise.all([
      prisma.instituicao.findFirst({
        where: {
          id: instituicaoId,
          slug,
        },

        select: {
          nome: true,
          slug: true,
        },
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          ativo: true,
          exigirFoto: true,
          exigirLocalizacao: true,
          reconhecimentoFacialAtivo: true,
          exigirProvaVida: true,
          permitirForaDoRaio: true,
          exigirFuncionarioLiberado: true,
          raioPadraoMetros: true,
          fusoHorario: true,
        },
      }),

      prisma.funcionario.findFirst({
        where: {
          userId: usuarioId,
          instituicaoId,
        },

        select: {
          nome: true,
          cargo: true,
          fotoPerfil: true,
          ativo: true,
          statusFuncionario: true,

          pontoMobileLiberado: true,
          pontoMobileValidoAte: true,

          user: {
            select: {
              email: true,
              ativo: true,
            },
          },
        },
      }),
    ]);

    if (!instituicao) {
      return NextResponse.json(
        {
          error:
            "Esta instituição não corresponde ao seu acesso.",
        },
        {
          status: 403,
        }
      );
    }

    if (!configuracao?.ativo) {
      return NextResponse.json(
        {
          error:
            "O Ponto Mobile está desativado nesta instituição.",
        },
        {
          status: 403,
        }
      );
    }

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Não encontramos um cadastro de funcionário vinculado a este usuário.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      funcionario.ativo !== true ||
      funcionario.user.ativo !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Seu cadastro de funcionário está inativo.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      configuracao.exigirFuncionarioLiberado &&
      funcionario.pontoMobileLiberado !== true
    ) {
      return NextResponse.json(
        {
          error:
            "Seu acesso ao Ponto Mobile não foi liberado pelo RH.",
        },
        {
          status: 403,
        }
      );
    }

    const acessoExpirado =
      funcionario.pontoMobileValidoAte !== null &&
      funcionario.pontoMobileValidoAte.getTime() <
        agora.getTime();

    if (acessoExpirado) {
      return NextResponse.json(
        {
          error:
            "Sua autorização para utilizar o Ponto Mobile está expirada.",
        },
        {
          status: 403,
        }
      );
    }

    const fusoHorario =
      configuracao.fusoHorario ||
      "America/Sao_Paulo";

    const inicioConsulta = new Date(
      agora.getTime() -
        36 * 60 * 60 * 1000
    );

    const [
      marcacoesRecentes,
      quantidadeLocaisAtivos,
    ] = await Promise.all([
      prisma.marcacaoPontoMobileRH.findMany({
        where: {
          instituicaoId,
          status: "VALIDA",

          funcionario: {
            userId: usuarioId,
          },

          dataHora: {
            gte: inicioConsulta,
          },
        },

        orderBy: {
          dataHora: "asc",
        },

        take: 100,

        select: {
          tipo: true,
          dataHora: true,
          comprovanteCodigo: true,
          statusLocalizacao: true,
          reconhecimentoStatus: true,
        },
      }),

      prisma.localPontoMobileRH.count({
        where: {
          instituicaoId,
          ativo: true,
        },
      }),
    ]);

    const dataLocalHoje = obterDataLocal(
      agora,
      fusoHorario
    );

    const marcacoesHoje =
      marcacoesRecentes.filter(
        (marcacao) =>
          obterDataLocal(
            marcacao.dataHora,
            fusoHorario
          ) === dataLocalHoje
      );

    const ultimaMarcacao =
      marcacoesHoje.length > 0
        ? marcacoesHoje[
            marcacoesHoje.length - 1
          ]
        : null;

    const nomeInstituicao = String(
      instituicao.nome || "Instituição"
    ).replace(/^([^-]+)-(.+)$/, "$1 – $2");

    return NextResponse.json({
      sucesso: true,

      servidor: {
        dataHora: agora.toISOString(),
        dataLocal: dataLocalHoje,
        fusoHorario,
      },

      instituicao: {
        slug: instituicao.slug,
        nome: nomeInstituicao,
      },

      funcionario: {
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        email: funcionario.user.email,
        fotoPerfil: funcionario.fotoPerfil,

        acessoValidoAte:
          funcionario.pontoMobileValidoAte,
      },

      configuracao: {
        exigirFoto:
          configuracao.exigirFoto,

        exigirLocalizacao:
          configuracao.exigirLocalizacao,

        permitirForaDoRaio:
          configuracao.permitirForaDoRaio,

        raioPadraoMetros:
          configuracao.raioPadraoMetros,

        reconhecimentoFacialAtivo:
          configuracao.reconhecimentoFacialAtivo,

        exigirProvaVida:
          configuracao.exigirProvaVida,

        quantidadeLocaisAtivos,
      },

      jornada: {
        concluida: false,

        ultimaMarcacaoTipo:
          ultimaMarcacao?.tipo || null,

        opcoesMarcacao: [
          {
            tipo: "ENTRADA",
            rotulo: "Registrar entrada",
          },
          {
            tipo: "SAIDA",
            rotulo: "Registrar saída",
          },
        ],

        marcacoesHoje: marcacoesHoje.map(
          (marcacao) => ({
            tipo: marcacao.tipo,
            dataHora:
              marcacao.dataHora.toISOString(),

            comprovanteCodigo:
              marcacao.comprovanteCodigo,

            statusLocalizacao:
              marcacao.statusLocalizacao,

            reconhecimentoStatus:
              marcacao.reconhecimentoStatus,
          })
        ),
      },
    });
  } catch (error) {
    console.error(
      "Erro ao carregar contexto do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os dados do registro de ponto.",
      },
      {
        status: 500,
      }
    );
  }
}
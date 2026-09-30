import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

type ContextoRota = {
  params: {
    id: string;
  };
};

type ContextoUsuario = {
  id: number;
  instituicaoId: number;
  podeGerenciar: boolean;
  polosPermitidos:
    | number[]
    | null;
};

function obterIdAtividade(
  contexto:
    ContextoRota
) {
  const atividadeId =
    Number(
      contexto.params.id
    );

  if (
    !Number.isInteger(
      atividadeId
    ) ||
    atividadeId <= 0
  ) {
    return null;
  }

  return atividadeId;
}

function obterId(
  valor:
    unknown
) {
  const numero =
    Number(
      valor
    );

  if (
    !Number.isInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function limparTexto(
  valor:
    unknown,
  limite:
    number
) {
  if (
    typeof valor !==
    "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  return texto.slice(
    0,
    limite
  );
}

function obterBooleano(
  valor:
    unknown
) {
  return valor === true;
}

async function obterContextoUsuario(): Promise<
  ContextoUsuario | null
> {
  const token =
    await getUserFromToken();

  if (!token) {
    return null;
  }

  const usuario =
    await prisma.user.findFirst({
      where: {
        id:
          token.id,

        instituicaoId:
          token.instituicaoId,

        ativo:
          true,
      },

      select: {
        id:
          true,

        instituicaoId:
          true,

        role:
          true,

        acessoTodosPolos:
          true,

        funcionario: {
          select: {
            ativo:
              true,

            statusFuncionario:
              true,

            permissoes: {
              where: {
                ativo:
                  true,
              },

              select: {
                chave:
                  true,
              },
            },

            departamento: {
              select: {
                permissoes: {
                  where: {
                    ativo:
                      true,
                  },

                  select: {
                    chave:
                      true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!usuario) {
    return null;
  }

  const role =
    String(
      usuario.role ||
        ""
    ).toUpperCase();

  const administrador =
    role ===
      "ADMIN" ||
    role ===
      "SUPER_ADMIN";

  let podeVer =
    administrador;

  let podeGerenciar =
    administrador;

  if (!administrador) {
    const funcionario =
      usuario.funcionario;

    if (
      funcionario &&
      funcionario.ativo &&
      funcionario
        .statusFuncionario ===
        "ATIVO"
    ) {
      const permissoes =
        new Set([
          ...(
            funcionario
              .permissoes ||
            []
          ).map(
            (item) =>
              item.chave
          ),

          ...(
            funcionario
              .departamento
              ?.permissoes ||
            []
          ).map(
            (item) =>
              item.chave
          ),
        ]);

      podeVer =
        permissoes.has(
          "atividades-externas.ver"
        ) ||
        permissoes.has(
          "atividades-externas.gerenciar"
        );

      podeGerenciar =
        permissoes.has(
          "atividades-externas.gerenciar"
        );
    }
  }

  if (!podeVer) {
    return null;
  }

  let polosPermitidos:
    | number[]
    | null =
      null;

  if (
    !usuario
      .acessoTodosPolos
  ) {
    const acessos =
      await prisma.userPolo.findMany({
        where: {
          userId:
            usuario.id,

          instituicaoId:
            usuario.instituicaoId,

          ativo:
            true,
        },

        select: {
          poloId:
            true,
        },
      });

    polosPermitidos =
      acessos.map(
        (item) =>
          item.poloId
      );
  }

  return {
    id:
      usuario.id,

    instituicaoId:
      usuario.instituicaoId,

    podeGerenciar,

    polosPermitidos,
  };
}

async function obterAtividade(
  atividadeId:
    number,
  usuario:
    ContextoUsuario
) {
  return prisma
    .atividadeExterna
    .findFirst({
      where: {
        id:
          atividadeId,

        instituicaoId:
          usuario
            .instituicaoId,

        ...(usuario
          .polosPermitidos !==
        null
          ? {
              OR: [
                {
                  poloId:
                    null,
                },

                {
                  poloId: {
                    in:
                      usuario
                        .polosPermitidos,
                  },
                },
              ],
            }
          : {}),
      },

      select: {
        id:
          true,

        instituicaoId:
          true,
      },
    });
}

function possuiAlertaSaude(
  ficha: {
    possuiAlergia:
      boolean;

    possuiRestricaoAlimentar:
      boolean;

    utilizaMedicacao:
      boolean;

    necessitaMedicacaoDuranteAtividade:
      boolean;

    possuiCondicaoSaudeRelevante:
      boolean;

    possuiNecessidadeEspecial:
      boolean;

    necessitaAcessibilidade:
      boolean;

    necessitaAcompanhamentoIndividual:
      boolean;
  } | null
) {
  if (!ficha) {
    return false;
  }

  return Boolean(
    ficha.possuiAlergia ||
      ficha.possuiRestricaoAlimentar ||
      ficha.utilizaMedicacao ||
      ficha
        .necessitaMedicacaoDuranteAtividade ||
      ficha
        .possuiCondicaoSaudeRelevante ||
      ficha
        .possuiNecessidadeEspecial ||
      ficha
        .necessitaAcessibilidade ||
      ficha
        .necessitaAcompanhamentoIndividual
  );
}

export async function GET(
  _request:
    NextRequest,
  contexto:
    ContextoRota
) {
  try {
    const atividadeId =
      obterIdAtividade(
        contexto
      );

    if (!atividadeId) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ID_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status:
            403,
        }
      );
    }

    const atividade =
      await obterAtividade(
        atividadeId,
        usuario
      );

    if (!atividade) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ATIVIDADE_NAO_ENCONTRADA",
        },
        {
          status:
            404,
        }
      );
    }

    const participantes =
      await prisma
        .atividadeExternaParticipante
        .findMany({
          where: {
            instituicaoId:
              usuario
                .instituicaoId,

            atividadeExternaId:
              atividade.id,
          },

          select: {
            id:
              true,

            alunoId:
              true,

            statusParticipacao:
              true,

            statusPresenca:
              true,

            aluno: {
              select: {
                id:
                  true,

                nome:
                  true,

                nomeSocial:
                  true,

                matricula:
                  true,

                fotoPerfil:
                  true,

                poloId:
                  true,
              },
            },

            saude:
              true,
          },
        });

    participantes.sort(
      (
        a,
        b
      ) =>
        (
          a.aluno
            .nomeSocial ||
          a.aluno.nome
        ).localeCompare(
          b.aluno
            .nomeSocial ||
            b.aluno.nome,
          "pt-BR"
        )
    );

    const fichasPreenchidas =
      participantes.filter(
        (item) =>
          Boolean(
            item.saude
          )
      ).length;

    const comAlertas =
      participantes.filter(
        (item) =>
          possuiAlertaSaude(
            item.saude
          )
      ).length;

    const confirmadas =
      participantes.filter(
        (item) =>
          Boolean(
            item.saude
              ?.informacaoConfirmadaPeloResponsavel
          )
      ).length;

    return NextResponse.json({
      ok:
        true,

      podeGerenciar:
        usuario
          .podeGerenciar,

      resumo: {
        participantes:
          participantes.length,

        fichasPreenchidas,

        comAlertas,

        confirmadas,
      },

      participantes:
        participantes.map(
          (item) => ({
            ...item,

            temAlerta:
              possuiAlertaSaude(
                item.saude
              ),
          })
        ),
    });
  } catch (erro) {
    console.error(
      "[ATIVIDADES_EXTERNAS_SAUDE_GET]",
      erro
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "ERRO_INTERNO",
      },
      {
        status:
          500,
      }
    );
  }
}

export async function POST(
  request:
    NextRequest,
  contexto:
    ContextoRota
) {
  try {
    const atividadeId =
      obterIdAtividade(
        contexto
      );

    if (!atividadeId) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ID_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const usuario =
      await obterContextoUsuario();

    if (!usuario) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
        },
        {
          status:
            403,
        }
      );
    }

    if (
      !usuario
        .podeGerenciar
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "SEM_PERMISSAO_GERENCIAR",
        },
        {
          status:
            403,
        }
      );
    }

    const atividade =
      await obterAtividade(
        atividadeId,
        usuario
      );

    if (!atividade) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ATIVIDADE_NAO_ENCONTRADA",
        },
        {
          status:
            404,
        }
      );
    }

    const corpo =
      await request
        .json()
        .catch(
          () =>
            null
        );

    if (
      !corpo ||
      corpo.acao !==
        "SALVAR_FICHA"
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "ACAO_INVALIDA",
        },
        {
          status:
            400,
        }
      );
    }

    const participanteId =
      obterId(
        corpo
          .participanteId
      );

    if (!participanteId) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "PARTICIPANTE_INVALIDO",
        },
        {
          status:
            400,
        }
      );
    }

    const participante =
      await prisma
        .atividadeExternaParticipante
        .findFirst({
          where: {
            id:
              participanteId,

            instituicaoId:
              usuario
                .instituicaoId,

            atividadeExternaId:
              atividade.id,
          },

          select: {
            id:
              true,
          },
        });

    if (!participante) {
      return NextResponse.json(
        {
          ok:
            false,

          error:
            "PARTICIPANTE_NAO_ENCONTRADO",
        },
        {
          status:
            404,
        }
      );
    }

    const existente =
      await prisma
        .atividadeExternaSaudeParticipante
        .findFirst({
          where: {
            participanteId:
              participante.id,

            atividadeExternaId:
              atividade.id,

            instituicaoId:
              usuario
                .instituicaoId,
          },

          select: {
            id:
              true,

            informacaoConfirmadaPeloResponsavel:
              true,

            confirmadaEm:
              true,
          },
        });

    const informacaoConfirmadaPeloResponsavel =
      obterBooleano(
        corpo
          .informacaoConfirmadaPeloResponsavel
      );

    const confirmadaEm =
      informacaoConfirmadaPeloResponsavel
        ? (
            existente
              ?.informacaoConfirmadaPeloResponsavel &&
            existente
              .confirmadaEm
              ? existente
                  .confirmadaEm
              : new Date()
          )
        : null;

    const possuiAlergia =
      obterBooleano(
        corpo.possuiAlergia
      );

    const possuiRestricaoAlimentar =
      obterBooleano(
        corpo.possuiRestricaoAlimentar
      );

    const utilizaMedicacao =
      obterBooleano(
        corpo.utilizaMedicacao
      );

    const necessitaMedicacaoDuranteAtividade =
      obterBooleano(
        corpo
          .necessitaMedicacaoDuranteAtividade
      );

    const possuiCondicaoSaudeRelevante =
      obterBooleano(
        corpo
          .possuiCondicaoSaudeRelevante
      );

    const possuiNecessidadeEspecial =
      obterBooleano(
        corpo
          .possuiNecessidadeEspecial
      );

    const necessitaAcessibilidade =
      obterBooleano(
        corpo
          .necessitaAcessibilidade
      );

    const necessitaAcompanhamentoIndividual =
      obterBooleano(
        corpo
          .necessitaAcompanhamentoIndividual
      );

    const dados = {
      possuiAlergia,

      alergias:
        possuiAlergia
          ? limparTexto(
              corpo.alergias,
              5000
            )
          : null,

      possuiRestricaoAlimentar,

      restricoesAlimentares:
        possuiRestricaoAlimentar
          ? limparTexto(
              corpo
                .restricoesAlimentares,
              5000
            )
          : null,

      utilizaMedicacao,

      medicacoes:
        utilizaMedicacao
          ? limparTexto(
              corpo.medicacoes,
              5000
            )
          : null,

      necessitaMedicacaoDuranteAtividade,

      instrucoesMedicacao:
        necessitaMedicacaoDuranteAtividade
          ? limparTexto(
              corpo
                .instrucoesMedicacao,
              5000
            )
          : null,

      possuiCondicaoSaudeRelevante,

      condicoesSaudeRelevantes:
        possuiCondicaoSaudeRelevante
          ? limparTexto(
              corpo
                .condicoesSaudeRelevantes,
              5000
            )
          : null,

      possuiNecessidadeEspecial,

      necessidadesEspeciais:
        possuiNecessidadeEspecial
          ? limparTexto(
              corpo
                .necessidadesEspeciais,
              5000
            )
          : null,

      necessitaAcessibilidade,

      orientacoesAcessibilidade:
        necessitaAcessibilidade
          ? limparTexto(
              corpo
                .orientacoesAcessibilidade,
              5000
            )
          : null,

      necessitaAcompanhamentoIndividual,

      orientacoesAcompanhamento:
        necessitaAcompanhamentoIndividual
          ? limparTexto(
              corpo
                .orientacoesAcompanhamento,
              5000
            )
          : null,

      contatoEmergenciaNome:
        limparTexto(
          corpo
            .contatoEmergenciaNome,
          300
        ),

      contatoEmergenciaTelefone:
        limparTexto(
          corpo
            .contatoEmergenciaTelefone,
          100
        ),

      contatoEmergenciaParentesco:
        limparTexto(
          corpo
            .contatoEmergenciaParentesco,
          150
        ),

      medicoOuServicoReferencia:
        limparTexto(
          corpo
            .medicoOuServicoReferencia,
          300
        ),

      telefoneMedicoOuServico:
        limparTexto(
          corpo
            .telefoneMedicoOuServico,
          100
        ),

      planoSaudeOuSeguro:
        limparTexto(
          corpo
            .planoSaudeOuSeguro,
          300
        ),

      numeroPlanoOuSeguro:
        limparTexto(
          corpo
            .numeroPlanoOuSeguro,
          200
        ),

      observacoesEmergencia:
        limparTexto(
          corpo
            .observacoesEmergencia,
          5000
        ),

      informacaoConfirmadaPeloResponsavel,

      confirmadaEm,
    };

    const ficha =
      await prisma
        .atividadeExternaSaudeParticipante
        .upsert({
          where: {
            participanteId_atividadeExternaId_instituicaoId: {
              participanteId:
                participante.id,

              atividadeExternaId:
                atividade.id,

              instituicaoId:
                usuario
                  .instituicaoId,
            },
          },

          create: {
            instituicaoId:
              usuario
                .instituicaoId,

            atividadeExternaId:
              atividade.id,

            participanteId:
              participante.id,

            ...dados,

            registradaPorId:
              usuario.id,

            atualizadaPorId:
              usuario.id,
          },

          update: {
            ...dados,

            atualizadaPorId:
              usuario.id,
          },
        });

    return NextResponse.json({
      ok:
        true,

      acao:
        existente
          ? "ATUALIZAR_FICHA"
          : "CRIAR_FICHA",

      ficha,
    });
  } catch (erro) {
    console.error(
      "[ATIVIDADES_EXTERNAS_SAUDE_POST]",
      erro
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          "ERRO_INTERNO",
      },
      {
        status:
          500,
      }
    );
  }
}

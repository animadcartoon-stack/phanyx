import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioTemPermissao } from "@/lib/permissoes-server";

import {
  ErroMetaWhatsapp,
  listarTemplatesWabaMeta,
} from "@/lib/whatsapp/meta";

export const dynamic = "force-dynamic";

function normalizarTexto(
  valor?: string | null
) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

function criarChaveTemplate(params: {
  nome?: string | null;
  idioma?: string | null;
}) {
  return [
    normalizarTexto(params.nome),
    normalizarTexto(params.idioma),
  ].join("::");
}

export async function POST() {
  let instituicaoId: number | null = null;

  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isFinite(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição válida.",
        },
        {
          status: 400,
        }
      );
    }

    const permitido =
      await usuarioTemPermissao(
        user,
        "integracoes.whatsapp.gerenciar"
      );

    if (!permitido) {
      return NextResponse.json(
        {
          error:
            "Você não tem permissão para sincronizar os templates do WhatsApp.",
        },
        {
          status: 403,
        }
      );
    }

    const integracao =
      await prisma.whatsAppInstituicao.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          id: true,
          conectado: true,
          whatsappBusinessId: true,
          tokenAcessoCriptografado: true,
        },
      });

    if (!integracao) {
      return NextResponse.json(
        {
          error:
            "A instituição ainda não possui uma integração com o WhatsApp Business.",
        },
        {
          status: 404,
        }
      );
    }

    if (!integracao.conectado) {
      return NextResponse.json(
        {
          error:
            "A integração com o WhatsApp Business está desconectada.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !integracao.whatsappBusinessId ||
      !integracao.tokenAcessoCriptografado
    ) {
      return NextResponse.json(
        {
          error:
            "A integração não possui WABA ou credencial configurada.",
        },
        {
          status: 409,
        }
      );
    }

    const templatesMeta =
      await listarTemplatesWabaMeta({
        whatsappBusinessId:
          integracao.whatsappBusinessId,

        tokenCriptografado:
          integracao.tokenAcessoCriptografado,
      });

    const templatesLocais =
      await prisma.whatsAppTemplate.findMany({
        where: {
          instituicaoId,

          nomeMeta: {
            not: null,
          },
        },

        select: {
          id: true,
          nomeMeta: true,
          idioma: true,
        },
      });

    const templatesMetaPorChave =
      new Map(
        templatesMeta.map((template) => [
          criarChaveTemplate({
            nome: template.nome,
            idioma: template.idioma,
          }),
          template,
        ])
      );

    const resultados =
      templatesLocais.map((templateLocal) => {
        const chave = criarChaveTemplate({
          nome: templateLocal.nomeMeta,
          idioma: templateLocal.idioma,
        });

        const templateMeta =
          templatesMetaPorChave.get(chave);

        const statusMeta = templateMeta
          ? String(
              templateMeta.status || ""
            ).toUpperCase()
          : "NOT_FOUND";

        const aprovadoMeta =
          statusMeta === "APPROVED" ||
          statusMeta === "ACTIVE";

        return {
          templateLocal,
          templateMeta,
          statusMeta,
          aprovadoMeta,
        };
      });

    const agora = new Date();

    await prisma.$transaction([
      ...resultados.map((resultado) =>
        prisma.whatsAppTemplate.updateMany({
          where: {
            id: resultado.templateLocal.id,
            instituicaoId,
          },

          data: {
            whatsappInstituicaoId:
              integracao.id,

            statusMeta:
              resultado.statusMeta,

            categoriaMeta:
              resultado.templateMeta
                ?.categoria || null,

            aprovadoMeta:
              resultado.aprovadoMeta,
          },
        })
      ),

      prisma.whatsAppInstituicao.updateMany({
        where: {
          id: integracao.id,
          instituicaoId,
        },

        data: {
          ultimaSincronizacaoEm: agora,
          ultimaFalhaEm: null,
          ultimaFalhaMensagem: null,
        },
      }),
    ]);

    const encontrados =
      resultados.filter(
        (resultado) =>
          Boolean(resultado.templateMeta)
      ).length;

    const aprovados =
      resultados.filter(
        (resultado) =>
          resultado.aprovadoMeta
      ).length;

    return NextResponse.json({
      sucesso: true,

      message:
        aprovados > 0
          ? `${aprovados} template(s) aprovado(s) sincronizado(s) com a Meta.`
          : "Sincronização concluída, mas nenhum template aprovado foi encontrado.",

      resumo: {
        templatesLocais:
          templatesLocais.length,

        templatesRecebidosDaMeta:
          templatesMeta.length,

        encontrados,
        aprovados,

        naoEncontrados:
          templatesLocais.length -
          encontrados,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao sincronizar templates do WhatsApp:",
      error
    );

    if (
      instituicaoId &&
      Number.isFinite(instituicaoId)
    ) {
      try {
        await prisma.whatsAppInstituicao.updateMany({
          where: {
            instituicaoId,
          },

          data: {
            ultimaFalhaEm: new Date(),

            ultimaFalhaMensagem:
              error instanceof Error
                ? error.message.slice(0, 1000)
                : "Falha desconhecida ao sincronizar templates.",
          },
        });
      } catch (erroAtualizacao) {
        console.error(
          "Erro ao registrar falha da sincronização:",
          erroAtualizacao
        );
      }
    }

    if (error instanceof ErroMetaWhatsapp) {
      return NextResponse.json(
        {
          error: error.message,
          codigoMeta:
            error.codigoMeta ?? null,
          subcodigoMeta:
            error.subcodigoMeta ?? null,
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Não foi possível sincronizar os templates do WhatsApp.",
      },
      {
        status: 500,
      }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TipoComunicacaoWhatsApp,
} from "@prisma/client";

import {
  enviarComunicacaoWhatsapp,
} from "@/lib/whatsapp/enviar-comunicacao";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FUSO_PADRAO = "America/Sao_Paulo";

function fusoHorarioSeguro(
  valor?: string | null
) {
  const fuso =
    String(valor || "").trim() ||
    FUSO_PADRAO;

  try {
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: fuso,
    }).format(new Date());

    return fuso;
  } catch {
    return FUSO_PADRAO;
  }
}

function dataLocalIso(
  data: Date,
  fusoHorario: string
) {
  const partes =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: fusoHorario,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(data);

  const ano =
    partes.find(
      (parte) => parte.type === "year"
    )?.value || "";

  const mes =
    partes.find(
      (parte) => parte.type === "month"
    )?.value || "";

  const dia =
    partes.find(
      (parte) => parte.type === "day"
    )?.value || "";

  return `${ano}-${mes}-${dia}`;
}

function adicionarDiasDataIso(
  dataIso: string,
  quantidade: number
) {
  const [ano, mes, dia] =
    dataIso.split("-").map(Number);

  const data = new Date(
    Date.UTC(ano, mes - 1, dia)
  );

  data.setUTCDate(
    data.getUTCDate() + quantidade
  );

  return data.toISOString().slice(0, 10);
}

function formatarHoraReuniao(
  data: Date,
  fusoHorario: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: fusoHorario,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }
  ).format(data);
}

function linkPorTipo(tipo?: string | null) {
  if (tipo === "ALUNO") return "/aluno/reunioes";
  if (tipo === "PROFESSOR") return "/professor/reunioes";
  return "/admin/reunioes";
}

function chaveLembrete(params: {
  reuniaoId: number;
  usuarioId: number;
  periodo: "HOJE" | "AMANHA";
}) {
  return [
    "REUNIAO",
    params.reuniaoId,
    "LEMBRETE",
    params.periodo,
    "USUARIO",
    params.usuarioId,
  ].join(":");
}

type NovaNotificacao = {
  usuarioId: number;
  instituicaoId: number;
  tipo: string;
  titulo: string;
  descricao?: string;
  link?: string;
  chaveAgrupada: string;
};

export async function GET(req: Request) {
  try {
    /**
     * Proteção do cron.
     *
     * Esta rota pode gerar notificações e comunicações
     * automáticas para usuários de todas as instituições.
     * Portanto, nunca deve ficar acessível publicamente.
     */
    const authHeader =
      req.headers.get("authorization");

    const cronSecret =
      process.env.CRON_SECRET?.trim();

    if (!cronSecret) {
      console.error(
        "CRON_SECRET não está configurado."
      );

      return NextResponse.json(
        {
          error:
            "Serviço de cron não configurado.",
        },
        { status: 503 }
      );
    }

    if (
      authHeader !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          error: "Não autorizado",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);

    const dryRun =
      url.searchParams.get("dryRun") === "1";

    const agora = new Date();

    /**
     * Carrega os fusos institucionais.
     *
     * Instituições sem ConfiguracaoInstituicao
     * continuam funcionando com o padrão
     * America/Sao_Paulo.
     */
    const configuracoesInstituicoes =
      await prisma.configuracaoInstituicao.findMany({
        select: {
          instituicaoId: true,
          fusoHorario: true,
        },
      });

    const fusosPorInstituicao = new Map<
      number,
      string
    >(
      configuracoesInstituicoes.map(
        (configuracao) => [
          configuracao.instituicaoId,
          fusoHorarioSeguro(
            configuracao.fusoHorario
          ),
        ]
      )
    );

    function obterFusoInstituicao(
      instituicaoId: number
    ) {
      return (
        fusosPorInstituicao.get(
          instituicaoId
        ) || FUSO_PADRAO
      );
    }

    /**
     * Busca uma janela UTC propositalmente maior.
     *
     * Depois classificamos cada reunião como
     * HOJE ou AMANHÃ usando o fuso da própria
     * instituição.
     *
     * Isso evita depender do timezone do servidor
     * da Vercel.
     */
    const inicioJanela = new Date(
      agora.getTime() -
      24 * 60 * 60 * 1000
    );

    const fimJanela = new Date(
      agora.getTime() +
      72 * 60 * 60 * 1000
    );

    const reunioesCandidatas =
      await prisma.reuniao.findMany({
        where: {
          status: "AGENDADA",

          dataHora: {
            gte: inicioJanela,
            lte: fimJanela,
          },
        },

        include: {
          participantes: true,
        },
      });

    const reunioesHoje =
      reunioesCandidatas.filter(
        (reuniao) => {
          const fuso =
            obterFusoInstituicao(
              reuniao.instituicaoId
            );

          const hojeInstituicao =
            dataLocalIso(agora, fuso);

          const dataReuniao =
            dataLocalIso(
              reuniao.dataHora,
              fuso
            );

          return (
            dataReuniao === hojeInstituicao
          );
        }
      );

    const reunioesAmanha =
      reunioesCandidatas.filter(
        (reuniao) => {
          const fuso =
            obterFusoInstituicao(
              reuniao.instituicaoId
            );

          const hojeInstituicao =
            dataLocalIso(agora, fuso);

          const amanhaInstituicao =
            adicionarDiasDataIso(
              hojeInstituicao,
              1
            );

          const dataReuniao =
            dataLocalIso(
              reuniao.dataHora,
              fuso
            );

          return (
            dataReuniao ===
            amanhaInstituicao
          );
        }
      );

    const candidatas: NovaNotificacao[] = [];

    for (const reuniao of reunioesAmanha) {
      const hora = formatarHoraReuniao(
        reuniao.dataHora,
        obterFusoInstituicao(
          reuniao.instituicaoId
        )
      );

      for (const participante of reuniao.participantes) {
        if (!participante.userId) {
          continue;
        }

        candidatas.push({
          usuarioId: participante.userId,

          instituicaoId:
            reuniao.instituicaoId,

          tipo: "REUNIAO_LEMBRETE_AMANHA",

          titulo:
            "⏰ Amanhã você tem reunião",

          descricao:
            `${reuniao.titulo} • amanhã às ${hora}`,

          link: linkPorTipo(
            participante.tipo
          ),

          chaveAgrupada: chaveLembrete({
            reuniaoId: reuniao.id,
            usuarioId: participante.userId,
            periodo: "AMANHA",
          }),
        });
      }
    }

    for (const reuniao of reunioesHoje) {
      const hora = formatarHoraReuniao(
        reuniao.dataHora,
        obterFusoInstituicao(
          reuniao.instituicaoId
        )
      );

      for (const participante of reuniao.participantes) {
        if (!participante.userId) {
          continue;
        }

        candidatas.push({
          usuarioId: participante.userId,

          instituicaoId:
            reuniao.instituicaoId,

          tipo: "REUNIAO_LEMBRETE_HOJE",

          titulo:
            "📅 Hoje você tem reunião",

          descricao:
            `${reuniao.titulo} • hoje às ${hora}`,

          link: linkPorTipo(
            participante.tipo
          ),

          chaveAgrupada: chaveLembrete({
            reuniaoId: reuniao.id,
            usuarioId: participante.userId,
            periodo: "HOJE",
          }),
        });
      }
    }

    /**
     * Impede que uma nova execução da rota
     * recrie lembretes que já existem.
     */
    const chaves = candidatas.map(
      (item) => item.chaveAgrupada
    );

    const jaExistentes =
      chaves.length > 0
        ? await prisma.notificacao.findMany({
          where: {
            chaveAgrupada: {
              in: chaves,
            },
          },
          select: {
            chaveAgrupada: true,
          },
        })
        : [];

    const chavesExistentes = new Set(
      jaExistentes
        .map((item) => item.chaveAgrupada)
        .filter(
          (valor): valor is string =>
            Boolean(valor)
        )
    );

    const notificacoesParaCriar =
      candidatas.filter(
        (item) =>
          !chavesExistentes.has(
            item.chaveAgrupada
          )
      );

    /**
* Modo seguro de teste.
*
* Valida autenticação, busca reuniões e calcula
* os lembretes, mas não grava notificações e
* não dispara WhatsApp.
*/
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,

        reunioesAmanha:
          reunioesAmanha.length,

        reunioesHoje:
          reunioesHoje.length,

        lembretesEncontrados:
          candidatas.length,

        notificacoesQueSeriamCriadas:
          notificacoesParaCriar.length,

        notificacoesJaExistentes:
          candidatas.length -
          notificacoesParaCriar.length,

        whatsapp: {
          processados: 0,
          enviados: 0,
          ignorados: 0,
          falhos: 0,
        },
      });
    }

    if (notificacoesParaCriar.length > 0) {
      await prisma.notificacao.createMany({
        data: notificacoesParaCriar,
      });
    }

    /**
 * WhatsApp dos lembretes.
 *
 * O envio é complementar:
 * - WhatsApp desconectado não quebra o cron;
 * - automação desativada não quebra o cron;
 * - template inexistente ou não aprovado não quebra o cron;
 * - a chave de idempotência impede envio duplicado.
 */
    const enviosWhatsapp: Array<
      ReturnType<typeof enviarComunicacaoWhatsapp>
    > = [];

    /**
     * Lembretes para amanhã.
     */
    for (const reuniao of reunioesAmanha) {
      const hora = formatarHoraReuniao(
        reuniao.dataHora,
        obterFusoInstituicao(
          reuniao.instituicaoId
        )
      );

      const quando = `amanhã às ${hora}`;

      for (const participante of reuniao.participantes) {
        enviosWhatsapp.push(
          enviarComunicacaoWhatsapp({
            instituicaoId:
              reuniao.instituicaoId,

            usuarioId:
              participante.userId ?? null,

            tipoComunicacao:
              TipoComunicacaoWhatsApp.REUNIAO_LEMBRETE,

            chaveIdempotencia: [
              "instituicao",
              reuniao.instituicaoId,
              "reuniao",
              reuniao.id,
              "lembrete",
              "amanha",
              "participante",
              participante.id,
            ].join(":"),

            telefone:
              participante.telefone ?? null,

            nomeDestinatario:
              participante.nome ?? null,

            parametros: {
              reuniaoId: reuniao.id,
              participanteId:
                participante.id,
              periodo: "AMANHA",
              titulo: reuniao.titulo,
              dataHora:
                reuniao.dataHora.toISOString(),
              quando,
              link: reuniao.link ?? null,
            },

            componentes: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text:
                      participante.nome?.trim() ||
                      "Participante",
                  },
                  {
                    type: "text",
                    text: reuniao.titulo,
                  },
                  {
                    type: "text",
                    text: quando,
                  },
                  {
                    type: "text",
                    text:
                      reuniao.link?.trim() ||
                      "Acesse o PHANYX para mais informações.",
                  },
                ],
              },
            ],
          })
        );
      }
    }

    /**
     * Lembretes para hoje.
     */
    for (const reuniao of reunioesHoje) {
      const hora = formatarHoraReuniao(
        reuniao.dataHora,
        obterFusoInstituicao(
          reuniao.instituicaoId
        )
      );
      const quando = `hoje às ${hora}`;

      for (const participante of reuniao.participantes) {
        enviosWhatsapp.push(
          enviarComunicacaoWhatsapp({
            instituicaoId:
              reuniao.instituicaoId,

            usuarioId:
              participante.userId ?? null,

            tipoComunicacao:
              TipoComunicacaoWhatsApp.REUNIAO_LEMBRETE,

            chaveIdempotencia: [
              "instituicao",
              reuniao.instituicaoId,
              "reuniao",
              reuniao.id,
              "lembrete",
              "hoje",
              "participante",
              participante.id,
            ].join(":"),

            telefone:
              participante.telefone ?? null,

            nomeDestinatario:
              participante.nome ?? null,

            parametros: {
              reuniaoId: reuniao.id,
              participanteId:
                participante.id,
              periodo: "HOJE",
              titulo: reuniao.titulo,
              dataHora:
                reuniao.dataHora.toISOString(),
              quando,
              link: reuniao.link ?? null,
            },

            componentes: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text:
                      participante.nome?.trim() ||
                      "Participante",
                  },
                  {
                    type: "text",
                    text: reuniao.titulo,
                  },
                  {
                    type: "text",
                    text: quando,
                  },
                  {
                    type: "text",
                    text:
                      reuniao.link?.trim() ||
                      "Acesse o PHANYX para mais informações.",
                  },
                ],
              },
            ],
          })
        );
      }
    }

    const resultadosWhatsapp =
      await Promise.allSettled(enviosWhatsapp);

    const whatsappEnviados =
      resultadosWhatsapp.filter(
        (resultado) =>
          resultado.status === "fulfilled" &&
          resultado.value.enviado
      ).length;

    const whatsappIgnorados =
      resultadosWhatsapp.filter(
        (resultado) =>
          resultado.status === "fulfilled" &&
          !resultado.value.enviado &&
          resultado.value.ignorado
      ).length;

    const whatsappFalhos =
      resultadosWhatsapp.filter(
        (resultado) =>
          resultado.status === "rejected" ||
          (
            resultado.status === "fulfilled" &&
            !resultado.value.enviado &&
            !resultado.value.ignorado
          )
      ).length;

    return NextResponse.json({
      ok: true,

      reunioesAmanha:
        reunioesAmanha.length,

      reunioesHoje:
        reunioesHoje.length,

      lembretesEncontrados:
        candidatas.length,

      notificacoesCriadas:
        notificacoesParaCriar.length,

      notificacoesIgnoradas:
        candidatas.length -
        notificacoesParaCriar.length,

      whatsapp: {
        processados:
          resultadosWhatsapp.length,

        enviados:
          whatsappEnviados,

        ignorados:
          whatsappIgnorados,

        falhos:
          whatsappFalhos,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao gerar lembretes de reuniões:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar lembretes de reuniões",
      },
      { status: 500 }
    );
  }
}